'use strict';

const winston = require('winston');
const Chance = require('chance');

const chance = new Chance();

const config = require('./config');
const Slack = require('../lib');
const slack = new Slack({ webhooks: config.webhook.single });

const metal = [
  'You cannot kill the battery!',
  'WAKE UP! ALSNFALSGNAKLGNENGGWEKGNE MAKE UP!',
  `I have a constant fear that something's always near!`,
  'You take a mortal man... and put him in control!',
];

const msgOpts = {
  channel: '#development',
  text: chance.pick(metal),
  userName: 'Metal bot',
  iconEmoji: ':metal:',
};

slack.webhook(msgOpts).then(() => {
  winston.info('First webhook example was successful.');
}).catch((error) => {
  winston.error('First webhook example went wrong.');
  winston.error(error.stack);
});
