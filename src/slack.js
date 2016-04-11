import _ from 'lodash';
import request from 'requestretry';

import { validateWebhooks } from './validate';

/**
 * Slack class which will handle the slack requests
 */
export class Slack {
  constructor({
    token,
    timeout = 10 * 1000,
    maxAttempts = 3,
    webhooks,
    url = 'https://slack.com/api/',
  } = {}) {
    this.token = token;
    this.DEFAULT_TIMEOUT = timeout;
    this.DEFAULT_MAX_ATTEMPTS = maxAttempts;
    this.webhooks = [];
    if (webhooks && validateWebhooks(webhooks)) {
      this.webhooks = _.cloneDeep(webhooks);
    }
    if (webhooks && !_.isArray(webhooks) && _.isString(webhooks)) {
      this.webhooks = [_.cloneDeep(webhooks)];
    }
    this.url = url;
  }

  /**
   * Adding webhooks to the current webhook storage
   * @param {String | String[]} webhooks Webhook URL or
   * URLs which should be added to the current storage.
   * @return {Object} Returns the instance from the class.
   */
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

  /**
   * Delete all the stored webhooks and
   * set totally new ones which are given
   * as a parameter to the function
   * @param {String | String[]} webhooks String or Array of strings
   * which are going to be stored.
   * @return {Object} Returns the instance from the class.
   */
  setWebhooks(webhooks) {
    this.webhooks = [];
    this.addWebhooks(webhooks);
    return this;
  }

  /**
   * Removing the given webhooks from
   * the stored ones, if they are stored.
   * @param  {String | String[]} webhooks webhooks
   * which should be removed.
   * @return {Object}  Returns the instance
   * from the class.
   */
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

  /**
   * Detecting if the given emoji is an url
   * or an existing emoji in the slack system.
   * @param  {String} emoji URL or emoji strings
   * @return {Object} Returns an object which has a
   * key and a value based on the given parameters.
   */
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

  /**
   * Async function which is sending messages
   * to the stored webhooks one by one.
   * @param  {Object}   options Option object.
   * @param  {Function} cb      Possible callback function.
   * @return {Promise<Object[]>}  Returns array of responses
   * from the stored webhooks.
   */
  async webhook(options, cb) {
    const emoji = this.detectEmoji(options.iconEmoji);
    const payload = {
      response_type: options.response_type || 'ephemeral',
      channel: options.channel || '#general',
      text: options.text || '',
      username: options.userName,
      attachments: options.attachments,
    };
    payload[emoji.key] = emoji.val;
    const responsePromises = _.map(this.webhooks, (webhook) => {
      return request({
        method: 'POST',
        url: webhook,
        body: payload,
        timeout: this.timeout,
        maxAttempts: this.maxAttempts,
        retryDelay: 0,
        json: true,
      });
    });
    try {
      let responses = await Promise.all(responsePromises);
      responses = _.map(responses, (res) => {
        const parsedRes = _.attempt(() => JSON.parse(res.body));
        if (!_.isError(parsedRes)) {
          res.body = parsedRes;
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

  /**
   * Async function which can communicate with the API
   * of the slack.
   * @param  {String}   method   Method which is called.
   * @param  {Object}   options = {} Possible options object which
   * can be a callback function as well, and defined as an empty
   * object if nothing is given in the parameter.
   * @param  {Function} callback Callback if there is an options
   * and the user would like to use callback.
   * @return {Promise<Object>} Returns a promise about the result
   * of the API request.
   */
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

  /**
   * Function which is handling callbacks if
   * they are avaliable.
   * @param  {Function} cb       Optional callback functionality
   * @param  {Object}   err      Error object.
   * @param  {Object}   response Response object.
   * @return {void} Returns nothing.
   */
  callbackIfValid(cb, err, response) {
    if (_.isFunction(cb)) {
      cb(err, response); // eslint-disable-line
    }
  }
}
