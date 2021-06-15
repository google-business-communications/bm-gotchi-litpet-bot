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

'use strict';

const firebase = require('firebase-admin');
const SERVICE_ACCOUNT = require('../resources/' + 'firebase-credentials.json');
const DEFAULT_HUNGER_SCORE = 80;
const DEFAULT_HYGEINE_SCORE = 80;
const DEFAULT_HAPPINESS_SCORE = 80;

firebase.initializeApp({
  credential: firebase.credential.cert(SERVICE_ACCOUNT),
  databaseURL: 'https://<YOUR_FIREBASE_PROJECT_URL_HERE>.firebaseio.com/',
});

/**
 * getUsers - Get list of users and information
 *
 * @return {type}  description
 */
async function getUserList() {
  return new Promise((resolve, reject) => {
      const db = firebase.database();
      const ref = db.ref(`users`);
      ref.once('value', (snapshot) => {
        let data = snapshot.val();
        if (data === undefined || data === null) {
          resolve(false);
        } else {
          resolve(data);
        }
      });
  });
}

/**
 * userExists - Check if a user exists
 *
 * @param  {string} conversationId The Conversation ID
 * @return {Promise} Resolves with whether user exists
 */
async function getUser(conversationId) {
  return new Promise((resolve, reject) => {
      const db = firebase.database();
      const ref = db.ref(`users/${conversationId}`);
      ref.once('value', (snapshot) => {
        let data = snapshot.val();
        if (data === undefined || data === null) {
          resolve(false);
        } else {
          resolve(data);
        }
      });
  });
}


/**
 * setPetType - Set the pet of a user
 * Default values are assigned to hygiene, hunger, and happiness so that the pet
 * starts off in a happy / clean / fed state.
 *
 * @param {string} petKey The pet key
 * @param  {string} conversationId The conversation ID
 * @return {Promise} Resolves if successful
 */
async function setPetType(petKey, conversationId) {
  return new Promise((resolve, reject) => {
      const db = firebase.database();
      const ref = db.ref(`users/${conversationId}`);
      ref.once('value', (snapshot) => {
        ref.set({
          species: petKey,
          room: 'bedroom',
          hygiene: DEFAULT_HYGEINE_SCORE,
          hunger: DEFAULT_HUNGER_SCORE,
          happiness: DEFAULT_HAPPINESS_SCORE,
          name: '',
        }, () => {
          resolve();
        });
      });
  });
}


/**
 * updateStat - Update the hunger/hygiene/happiness of pet
 *
 * @param  {type} conversationId The conversation ID
 * @param  {type} stat           The stat to update (hunger/hygiene/happiness)
 * @param  {type} newVal         The new value
 * @return {Promise}             Resolves when complete
 */
async function updateStat(conversationId, stat, newVal) {
  return new Promise((resolve, reject) => {
      const db = firebase.database();
      const ref = db.ref(`users/${conversationId}`);
      ref.update({[stat]: newVal}, () => {
        resolve();
      });
  });
}

module.exports = {
  getUser,
  setPetType,
  getUserList,
  updateStat,
};
