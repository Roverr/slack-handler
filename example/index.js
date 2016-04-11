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
  return slack.api('api.test');
}).then((res) => {
  if (res.body.ok) {
    return winston.info('Api example was successful.');
  }
  return winston.debug('Something went wrong with the example, no ok in body.');
}).catch((error) => {
  winston.error('Something went wrong with the example.');
  winston.error(error.stack);
});
