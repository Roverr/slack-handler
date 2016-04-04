import _ from 'lodash';
import request from 'requestretry';

import { validateWebhooks } from './validate';

export class Slack {
  constructor({
    token,
    domain,
    timeout = 10 * 1000,
    maxAttempts = 3,
    webhooks,
    logging = false,
    url = 'https://slack.com/api/',
  } = {}) {
    this.token = token;
    this.domain = domain;
    this.DEFAULT_TIMEOUT = timeout;
    this.DEFAULT_MAX_ATTEMPTS = maxAttempts;
    if (validateWebhooks(webhooks)) {
      this.webhooks = _.cloneDeep(webhooks);
    }
    if (!_.isArray(webhooks) && _.isString(webhooks)) {
      this.webhooks = [_.cloneDeep(webhooks)];
    }
    this.logging = logging;
    this.url = url;
  }

  addWebhooks(webhooks) {
    validateWebhooks(webhooks);
    if (_.isArray(webhooks)) {
      _.forEach(webhooks, (webhook) => {
        return this.webhooks.push(webhook);
      });
      return this;
    } else if (_.isString(webhooks)) {
      this.webhooks.push(webhooks);
      return this;
    }
  }

  setWebhooks(webhooks) {
    this.webhooks = [];
    this.addWebhooks(webhooks);
    return this;
  }

  removeWebhooks(webhooks) {
    if (_.isArray(webhooks)) {
      _.forEach(webhooks, (webhook) => {
        this.webhooks = _.filter(this.webhooks, (currentWebhook) => currentWebhook !== webhook);
      });
    } else if (_.isString(webhooks)) {
      this.webhooks = _.filter(this.webhooks, (currentWebhook) => currentWebhook !== webhooks);
    }
    return this;
  }

  detectEmoji(emoji) {
    const obj = {
      key: 'icon_emoji',
      val: '',
    };
    if (emoji) {
      obj.key = emoji.match(/^http/) ? 'icon_url' : 'icon_emoji';
      obj.val = emoji;
    }
    return obj;
  }

  async webhook(options, cb) {
    const emoji = this.detectEmoji(options.icon_emoji);
    const payload = {
      response_type: options.response_type || 'ephemeral',
      channel: options.channel,
      text: options.text,
      username: options.username,
      attachments: options.attachments,
      link_names: options.link_names || 0,
    };
    payload[emoji.key] = emoji.val;
    const responsePromises = _.map(this.webhooks, (webhook) => {
      return request({
        method: 'POST',
        url: webhook,
        body: JSON.stringify(payload),
        timeout: this.timeout,
        maxAttempts: this.maxAttempts,
        retryDelay: 0,
        json: true,
      });
    });
    try {
      let responses = await Promise.all(responsePromises);
      responses = _.map(responses, (res) => {
        if (_.isString(res.body)) {
          res.body = JSON.parse(res.body);
        }
        return res;
      });
      this.callbackIfValid(cb, null, responses);
      return responses;
    } catch (e) {
      this.callbackIfValid(cb, e);
      throw e;
    }
  }

  async api(method, options = {}, callback) {
    const opts = options;
    let cb = callback;
    const requestArg = {
      url: this.url + method,
      timeout: this.timeout,
      maxAttempts: this.maxAttempts,
      retryDelay: 0,
      json: true,
      method: 'GET',
      formData: {},
      qs: {},
    };
    if (_.isFunction(options)) {
      cb = options;
    }
    if (method === 'files.upload') {
      requestArg.method = 'POST';
      requestArg.formData = options;
    } else {
      requestArg.qs = options;
    }
    _.assign(opts, { token: this.token });
    requestArg.formData = _.omitBy(requestArg.formData, _.isUndefined);
    try {
      const response = await request(requestArg);
      this.callbackIfValid(cb, null, response);
      return response;
    } catch (e) {
      this.callbackIfValid(cb, e);
      throw e;
    }
  }

  callbackIfValid(cb, err, response) {
    if (_.isFunction(cb)) {
      cb(err, response); // eslint-disable-line
    }
  }
}
