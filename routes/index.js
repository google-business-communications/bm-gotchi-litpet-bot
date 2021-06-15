// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const path = require('path');
const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const schedule = require('node-schedule');
const firebaseHandler = require('../lib/firebase_helper');
const apiHelper = require('../lib/api_helper');
const pets = require('../resources/pets.json');
const {createCanvas, loadImage} = require('canvas');

const { COMMAND_START, COMMAND_CHOOSE_PET, COMMAND_FEED_PET,
  COMMAND_FOOD_ITEM, COMMAND_PLAY_WITH_PET, COMMAND_CLEAN_PET,
  COMMAND_STATUS, COMMAND_CREDITS, COMMAND_SET, COMMAND_HELP,
  FOOD, GAMES, HAPPY_HUNGER_LEVEL, HAPPY_HYGEINE_LEVEL,
  HAPPY_HAPPINESS_LEVEL, HUNGRY_LEVEL, DIRTY_PET_VAL, SAD_PET_VAL,
  BORED_PET_VAL, STAT_COMMAND_COUNT} = require('../lib/constants')

  const { cleanPet } = require('../lib/gameplay_helper')

/**
 * Image generator public endpoint
 */
router.get('/image.png', function(req, res, next) {
  // Extract Parameters
  const roomArg = req.query.room || 'bedroom';
  const speciesArg = req.query.species || 'sensei';
  const colorArg = req.query.color || 'default';
  const stateArg = req.query.state || 'normal';
  const poopArg = req.query.poop || 'false';
  const runawayArg = req.query.runaway || 'false';

  (async () => {
    try {
      // Draw Room
      const room = await loadImage(path.join(__dirname, '../assets/rooms/' + roomArg + '.jpg'));
      const canvas = createCanvas(room.width, room.height);
      const context = canvas.getContext('2d');
      context.drawImage(room, 0, 0);

      // Draw Poop
      if (poopArg == 'true') {
        const poop = await loadImage(path.join(__dirname, '../assets/poop.png'));
        const left = canvas.width / 2 - poop.width / 2 - 75;
        const top = canvas.height - poop.height - 5;
        context.drawImage(poop, left, top);
      }
      if (runawayArg == 'false') {
        // Draw Pet
        const pet = await loadImage(path.join(__dirname, '../assets/pets/' + speciesArg + '/' + colorArg + '/' + stateArg + '.png'));
        const left = canvas.width / 2 - pet.width / 2 - (roomArg === 'spotlight' ? 5 : 0);
        const top = canvas.height - pet.height - (roomArg === 'spotlight' ? 85 : 5);
        context.drawImage(pet, left, top);
      }
      // Set MIME and pipe to response
      res.setHeader('Content-Type', 'image/png');
      canvas.createPNGStream().pipe(res);
    } catch (err) {
      res.status(404).send({
        message: err,
      });
    }
  })();
});

/**
 * The webhook callback method.
 */
router.post('/callback', function(req, res, next) {
  let requestBody = req.body;

  // Extract the message payload parameters
  let conversationId = requestBody.conversationId;

  // Check that the message and text values exist
  if (requestBody.message !== undefined
    && requestBody.message.text !== undefined) {
    let message = requestBody.message.text;

    routeMessage(req, message, conversationId);
  } else if (requestBody.suggestionResponse !== undefined) {
    let message = requestBody.suggestionResponse.postbackData;

    routeMessage(req, message, conversationId);
  }

  res.sendStatus(200);
});

/**
 * Routes the message received from the user to create a response.
 *
 * @param {object} req The HTTP request.
 * @param {string} message The message text received from the user.
 * @param {string} conversationId The unique id for this user and agent.
 */
async function routeMessage(req, message, conversationId) {
  let normalizedMessage = message.trim().toLowerCase();

  console.log('normalizedMessage: ' + normalizedMessage);
  const words = normalizedMessage.split(' ');
  const command = words[0];
  let user = await firebaseHandler.getUser(conversationId);
  if (ranAway(user)) {
    await firebaseHandler.updateStat(conversationId, 'ran_away', true);
  }
  user = await firebaseHandler.getUser(conversationId);

  if (user.species !== '' && user.name === '') {
    await firebaseHandler.updateStat(conversationId, 'name', message);
    sendResponse(apiHelper.produceMessageObj(`You've adopted ${message}. Take care of your new pet!`, getDefaultSuggestions())
    , conversationId);
  } else if (command === COMMAND_CHOOSE_PET) {
    // check if user is choosing a pet
    if (!user || !user.species || user.ran_away) {
      setUserPet(normalizedMessage, conversationId);
    } else {
      sendResponse(apiHelper.produceMessageObj(`You have already adopted a ${user.species}!`), conversationId);
    }
  } else if (command === COMMAND_START || !user || !user.species) {

    if (!user || !user.species || user.ran_away) {
      sendUserSelection(conversationId);
      sendCarousel(req, conversationId);
    } else {
      sendResponse(apiHelper.produceMessageObj(`You have already adopted a ${user.species}!`), conversationId);
    }
  } else if (ranAway(user)) {
    sendStatusCard(req, user, conversationId, `Oh no! You neglected ${user.name} and it ran away!`);
  } else if (command === COMMAND_FEED_PET) {
    const food = words[1];
    feedPet(req, user, conversationId, food);
  } else if (command === COMMAND_PLAY_WITH_PET) {
    const game = words[1];
    playWithPet(req, user, game, conversationId);
  } else if (command === COMMAND_CLEAN_PET) {
    cleanPet(req, user, conversationId);
  } else if (command === COMMAND_SET) {
    if (words.length === STAT_COMMAND_COUNT) {
      firebaseHandler.updateStat(conversationId, words[1], isNaN(words[2]) ? (words[2] === 'null' ? null : message.trim().split(' ')[2]) : parseInt(words[2]));
      sendResponse(apiHelper.produceMessageObj(`${words[1]} set to ${words[2]}`), conversationId);
    } else {
      sendResponse(apiHelper.produceMessageObj('Command not recognized. Usage:\nset <property> <value>'), conversationId);
    }
  } else if (command === COMMAND_STATUS) {
    sendStatusCard(req, user, conversationId, `${user.name} seems ${getWrittenState(user)}!`);
  } else if (command === COMMAND_CREDITS) {
    sendResponse(apiHelper.produceMessageObj('Pet Images by Megupets\nhttps://www.megupets.com/\n\nBackground Images by upklyak\nhttps://www.freepik.com/upklyak')
    , conversationId);
  } else if (command === COMMAND_HELP) {
    // send error message
    sendResponse(apiHelper.produceMessageObj('List of commands:\nfeed\nplay\nclean\nstatus\ncredits'), conversationId);
  } else {
    // send error message
    sendResponse(apiHelper.produceMessageObj('Command not recognized. Type help for a list of available commands.'), conversationId);
  }
}

/**
 * feedPet - Pet's need to be fed. When the pet's hunger level drops below a certain threshold
 * the pet will not be pleased. The user indicated that they would like to feed the pet so we
 * increase the pet's hunger score by some arbitrary amount by calling randomInt(10) plus 5.
 *
 * @param  {object} req The HTTP request.
 * @param  {object} user The user data.
 * @param  {string} conversationId The conversation ID.
 * @param  {string} food The food type.
 */
async function feedPet(req, user, conversationId, food) {
  if (food) {
    if (FOOD.indexOf(food) === -1) {
      sendResponse(apiHelper.produceMessageObj(`You don't have any ${food}!`), conversationId);
    } else {
      if (user.hunger >= 100) {
        sendStatusCard(req, user, conversationId, `${user.name} is too bloated to eat!`);
      } else {
        // Feeding the pet results in at least +5 to their hunger level, a random value is included.
        let val = randomInt(10) + 5;
        firebaseHandler.updateStat(conversationId, 'hunger', user.hunger + val);
        sendStatusCard(req, user, conversationId, `${food} | You fed ${user.name}! (+${val} food)`);
      }
    }
  } else {
    // Generate 3 random foods
    console.log('Generate foods');
    let foods = [];
    while (foods.length < 3) {
      let f = randomInt(FOOD.length);
      console.log(`Generated ${FOOD[f]}`);
      if (foods.indexOf(FOOD[f]) === -1) foods.push(FOOD[f]);
    }
    const suggestions = [
      {
        'reply': {
          'text': foods[0],
          'postbackData': `${COMMAND_FEED_PET} ${foods[0]}`,
        },
      },
      {
        'reply': {
          'text': foods[1],
          'postbackData': `${COMMAND_FEED_PET} ${foods[1]}`,
        },
      },
      {
        'reply': {
          'text': foods[2],
          'postbackData': `${COMMAND_FEED_PET} ${foods[2]}`,
        },
      },
    ]
    sendResponse(apiHelper.produceMessageObj(`What do you want to feed ${user.name}?`, suggestions), conversationId);
  }
}

/**
 * playWithPet - Play game with pet
 * @param  {string} game The game type
 * @param  {string} conversationId The conversation ID
 */
async function playWithPet(req, user, game, conversationId) {
  if (game) {
    if (GAMES.indexOf(game) === -1) {
      sendResponse(apiHelper.produceMessageObj(`${user.name} doesn't know how to play ${game}!`), conversationId);
    } else {
      // Feeding the pet results in at least +5 to their happiness level, a random value is included.
      let val = randomInt(15) + 5;
      firebaseHandler.updateStat(conversationId, 'happiness', user.happiness + val);
      sendStatusCard(req, user, conversationId, `${game} | You played with ${user.name}! (+${val} happiness)`);
    }
  } else {
    // Generate 3 random games
    console.log('Generate games');
    let games = [];
    while (games.length < 3) {
      let f = randomInt(GAMES.length);
      console.log(`Generated ${GAMES[f]}`);
      if (games.indexOf(GAMES[f]) === -1) games.push(GAMES[f]);
    }
    const suggestions = [
      {
        'reply': {
          'text': games[0],
          'postbackData': `${COMMAND_PLAY_WITH_PET} ${games[0]}`,
        },
      },
      {
        'reply': {
          'text': games[1],
          'postbackData': `${COMMAND_PLAY_WITH_PET} ${games[1]}`,
        },
      },
      {
        'reply': {
          'text': games[2],
          'postbackData': `${COMMAND_PLAY_WITH_PET} ${games[2]}`,
        },
      },
    ];
    sendResponse(apiHelper.produceMessageObj(`What do you want to play with ${user.name}?`, suggestions), conversationId);
  }
}




/**
 * setUserPet - The user has selected to adopt a pet. Associate a pet with the
 * conversationId that represents the user.
 *
 * @param  {string} normalizedMessage The message
 * @param  {string} conversationId The conversation ID
 */
async function setUserPet(normalizedMessage, conversationId) {
  // extract pet type from 'choosepet {pet type}'
  let petType = normalizedMessage.split(' ')[1];
  // save in firebase + send response
  await firebaseHandler.setPetType(petType, conversationId);
  if (petType === 'chicken') {
    let colors = ['blue', 'white', 'yellow'];
    firebaseHandler.updateStat(conversationId,
            'color', colors[randomInt(3)]);
  } else {
    firebaseHandler.updateStat(conversationId,
            'color', 'default');
  }
  sendResponse(apiHelper.produceMessageObj(`You have successfully adopted a ${petType}! What do you want to call it?`), conversationId);
}

/**
 * Returns a random integer from 0 (inclusive) to n (exclusive).
 *
 * @param {number} n
 */
function randomInt(n) {
  return Math.floor(Math.random() * n);
}

/**
 * Get the state of a pet.
 *
 * @param {object} pet The user data.
 */
function getState(pet) {
    if (pet.hunger >= HAPPY_HUNGER_LEVEL && pet.hygiene >= HAPPY_HYGEINE_LEVEL && pet.happiness > HAPPY_HAPPINESS_LEVEL) {
      return 'happy';
    } else if (pet.hunger < HUNGRY_LEVEL) {
      return 'hungry';
    } else if (pet.hygiene < DIRTY_PET_VAL || pet.happiness < SAD_PET_VAL) {
      return 'angry';
    } else if (pet.happiness < BORED_PET_VAL) {
      return 'bored';
    }
    return 'normal';
}

/**
 * Get the state of a pet.
 *
 * @param {object} pet The user data.
 */
function getWrittenState(pet) {
    let status = [];
    if (pet.hunger >= 80 && pet.hygiene >= 80 && pet.happiness > 80) {
      return 'happy';
    }
    if (pet.hunger < 50) {
      status.push('hungry');
    }
    if (pet.hygiene < 50) {
      status.push('dirty');
    }
    if (pet.happiness < 20) {
      status.push('angry');
    } else if (pet.happiness < 50) {
      status.push('bored');
    }

    console.log('STATUS', status);
    if (status.length === 0) {
      return 'normal';
    } else if (status.length == 1) {
      return status[0];
    } else if (status.length == 2) {
      return status[0] + ' and ' + status[1];
    } else {
      return status[0] + ', ' + status[1] + ', and ' + status[2];
    }
}

/**
 * Generate an image representing the state of the room.
 *
 * @param {object} req The HTTP request.
 * @param {object} pet The user data.
 */
function generateImageUrl(req, pet) {
    pet = pet || {};
    const room = pet.room || 'bedroom';
    const species = pet.species || 'sensei';
    const color = pet.color || (species === 'chicken' ? 'blue' : 'default');
    const poop = pet.hygiene < 50;
    const state = getState(pet);
    const runaway = ranAway(pet);

    return url = req.protocol + '://' + req.get('host') + '/image.png?'
      + 'room=' + room
      + '&species=' + species
      + '&color=' + color
      + '&state=' + state
      + '&poop=' + poop
      + '&runaway=' + runaway
    ;
}

/**
 * Sends a standalone card with status of the pet.
 *
 * @param {object} req The HTTP request.
 * @param {object} user The user data.
 * @param {string} conversationId The unique id for this user and agent.
 * @param {string} message The text that goes in the status card.
 */
function sendStatusCard(req, user, conversationId, message) {
  let statusCard = {
      'cardContent': {
        description: message,
        suggestions: user.ran_away ? getAdoptSuggestions() : getDefaultSuggestions(),
        media: {
          height: 'TALL',
          contentInfo: {
            fileUrl: generateImageUrl(req, user),
            forceRefresh: false,
          },
        },
      },
  };

  sendResponse({
        messageId: uuid.v4(),
        fallback: message,
        representative: {
          representativeType: 'BOT',
        },
        richCard: {
          standaloneCard: statusCard,
        },
      }, conversationId);
}

/**
 * Sends a pets rich card to the user.
 *
 * @param {object} req The HTTP request.
 * @param {string} conversationId The unique id for this user and agent.
 */
function sendCarousel(req, conversationId) {
  let carouselCard = getPetCarousel(req);
  let fallbackText = 'Pet List';

  sendResponse({
        messageId: uuid.v4(),
        fallback: fallbackText,
        representative: {
          representativeType: 'BOT',
        },
        richCard: {
          carouselCard: carouselCard,
        },
      }, conversationId);
}


/**
 * getDefaultSuggestions
 * @return {array} Default suggestions array
 */
function getDefaultSuggestions() {
  return [
    {
      reply: {
        text: '🥕 | Feed!',
        postbackData: COMMAND_FEED_PET,
      },
    },
    {
      reply: {
        text: '✨ | Clean!',
        postbackData: COMMAND_CLEAN_PET,
      },
    },
    {
      reply: {
        text: '🏈 | Play!',
        postbackData: COMMAND_PLAY_WITH_PET,
      },
    },
    {
      reply: {
        text: 'Status',
        postbackData: COMMAND_STATUS,
      },
    },
  ];
}

/**
 * getDefaultSuggestions
 * @return {array} Default suggestions array
 */
function getAdoptSuggestions() {
  return [
    {
      reply: {
        text: 'Adopt a new pet :(',
        postbackData: COMMAND_START,
      },
    },
  ];
}

/**
 * Creates a pet carousel
 *
 * @param {object} req The HTTP request.
 *
 * @return {object} A carousel rich card.
 */
function getPetCarousel(req) {
  let cardContents = [];

  // Create individual cards for the carousel
  for (let petKey in pets) {
    if (pets.hasOwnProperty(petKey)) {
      let pet = pets[petKey];
      cardContents.push({
        title: pet.name,
        description: `Adopt a ${pet.name}!`,
        suggestions: {
          'reply': {
            'text': `Choose ${pet.name}`,
            'postbackData': `${COMMAND_CHOOSE_PET} ${petKey}`,
          },
        },
        media: {
          height: 'MEDIUM',
          contentInfo: {
            fileUrl: generateImageUrl(req, {'species': petKey, 'room': 'spotlight'}),
            forceRefresh: false,
          },
        },
      });
    }
  }
  return {
    cardWidth: 'MEDIUM',
    cardContents: cardContents,
  };
}

/**
 * sendUserSelection - send the starter screen for choosing pets
 *
 * @param  {type} conversationId The conversation ID
 */
function sendUserSelection(conversationId) {
  let messageObject = apiHelper.produceMessageObj('Please choose a pet :)');
  sendResponse(messageObject, conversationId);
}

/**
 * Posts a message to the Business Messages API, first sending a typing
 * indicator event and sending a stop typing event after the message
 * has been sent.
 *
 * @param {object} messageObject The message object payload to send to the user.
 * @param {string} conversationId The unique id for this user and agent.
 */
function sendResponse(messageObject, conversationId) {
  const apiConnector = apiHelper.init();
  apiConnector.then(function(apiObject) {
    // Create the payload for sending a typing started event
    let apiEventParams = {
      auth: apiObject.authClient,
      parent: 'conversations/' + conversationId,
      resource: {
        eventType: 'TYPING_STARTED',
        representative: {
          representativeType: 'BOT',
        },
      },
      eventId: uuid.v4(),
    };

    // Send the typing started event
    apiObject.bmApi.conversations.events.create(apiEventParams, {},
      (err, response) => {
      console.error(err);
      console.log(response);

      let apiParams = {
        auth: apiObject.authClient,
        parent: 'conversations/' + conversationId,
        resource: messageObject,
      };

      // Call the message create function using the
      // Business Messages client library
      apiObject.bmApi.conversations.messages.create(apiParams, {},
        (err, response) => {
        console.log(err);
        console.log(response);

        // Update the event parameters
        apiEventParams.resource.eventType = 'TYPING_STOPPED';
        apiEventParams.eventId = uuid.v4();

        // Send the typing stopped event
        apiObject.bmApi.conversations.events.create(apiEventParams, {},
          (err, response) => {
          console.log(err);
          console.log(response);
        });
      });
    });
  }).catch(function(err) {
    console.log(err);
  });
}

function ranAway(user) {
  return user.happiness === 0 || user.hunger === 0;
}

/**
 * setupScheduler - Set schedulers to deplete H+H+H and check for pet runaway
 */
async function setupScheduler() {
  schedule.scheduleJob('*/5 * * * * *', async () => {
    let users = await firebaseHandler.getUserList();
    for (let conversationId in users) {
      if (users.hasOwnProperty(conversationId)) {
        if (users[conversationId].hunger > 0) {
          firebaseHandler.updateStat(conversationId,
            'hunger', users[conversationId].hunger - 5);
        }
        if (users[conversationId].happiness > 0) {
          firebaseHandler.updateStat(conversationId,
            'happiness', users[conversationId].happiness - 5);
        }
        if (users[conversationId].hygiene > 0) {
          firebaseHandler.updateStat(conversationId,
            'hygiene', users[conversationId].hygiene - 5);
        }
        let state = getWrittenState(users[conversationId]);
        let lastSent = users[conversationId].lastSent;
        if (lastSent !== undefined && ranAway(users[conversationId]) && lastSent !== 'ran_away') {
          firebaseHandler.updateStat(conversationId,
            'ran_away', true);
          firebaseHandler.updateStat(conversationId,
            'lastSent', 'ran_away');
          sendResponse(apiHelper.produceMessageObj(`${users[conversationId].name} ran away!`), conversationId);
        } else if (lastSent !== undefined && lastSent !== state && state !== 'normal') {
          firebaseHandler.updateStat(conversationId,
            'lastSent', state);
          sendResponse(apiHelper.produceMessageObj(`${users[conversationId].name} is ${state}!`), conversationId);
        }
      }
    }
  });
}

setupScheduler();

module.exports = router;
