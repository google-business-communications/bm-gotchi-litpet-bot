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

const COMMAND_START = 'start';
const COMMAND_CHOOSE_PET = 'choosepet';
const COMMAND_FEED_PET = 'feed';
const COMMAND_FOOD_ITEM = 'food';
const COMMAND_PLAY_WITH_PET = 'play';
const COMMAND_CLEAN_PET = 'clean';
const COMMAND_STATUS = 'status';
const COMMAND_CREDITS = 'credits';
const COMMAND_SET = 'set';
const COMMAND_HELP = 'help';

const FOOD = ['🍗', '🍔', '🍕', '🌮', '🥪', '🍣', '🥝', '🍓', '🍖'];
const GAMES = ['⚾', '🥏', '🏓', '🧩', '🎱', '⛳', '🏐', '🏈', '♟️'];

const HAPPY_HUNGER_LEVEL = 80;
const HAPPY_HYGEINE_LEVEL = 80;
const HAPPY_HAPPINESS_LEVEL = 80;
const HUNGRY_LEVEL = 50;
const DIRTY_PET_VAL = 50;
const SAD_PET_VAL = 20;
const BORED_PET_VAL = 50

const STAT_COMMAND_COUNT = 3;

module.exports = { COMMAND_START, COMMAND_CHOOSE_PET, COMMAND_FEED_PET, COMMAND_FOOD_ITEM, COMMAND_PLAY_WITH_PET, COMMAND_CLEAN_PET, COMMAND_STATUS, COMMAND_CREDITS, COMMAND_SET, COMMAND_HELP, FOOD, GAMES, HAPPY_HUNGER_LEVEL, HAPPY_HYGEINE_LEVEL, HAPPY_HAPPINESS_LEVEL, HUNGRY_LEVEL, DIRTY_PET_VAL, SAD_PET_VAL, BORED_PET_VAL, STAT_COMMAND_COUNT};