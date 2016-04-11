'use strict';

const convict = require('convict');
const dotenv = require('dotenv');

dotenv.config({ silent: true });

const conf = convict({
  webhook: {
    single: {
      doc: 'Single webhook which should be used by the examples.',
      format: String,
      default: 'Invalid',
      env: 'WEBHOOK_SINGLE',
    },
    array: {
      doc: 'Array of webhooks which should be used by the examples.',
      format: Array,
      default: ['Invalid'],
      env: 'WEBHOOK_ARRAY',
    },
  },
  apiKey: {
    doc: 'API token which can be used by the example to make API requests.',
    format: String,
    default: 'Invalid',
    env: 'API_KEY',
  },
});

conf.validate({ strict: true });

module.exports = conf.getProperties();
