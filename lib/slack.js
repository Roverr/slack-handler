'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Slack = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _requestretry = require('requestretry');

var _requestretry2 = _interopRequireDefault(_requestretry);

var _validate = require('./validate');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Slack class which will handle the slack requests
 */

var Slack = exports.Slack = function () {
  function Slack() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var token = _ref.token;
    var _ref$timeout = _ref.timeout;
    var timeout = _ref$timeout === undefined ? 10 * 1000 : _ref$timeout;
    var _ref$maxAttempts = _ref.maxAttempts;
    var maxAttempts = _ref$maxAttempts === undefined ? 3 : _ref$maxAttempts;
    var webhooks = _ref.webhooks;
    var _ref$url = _ref.url;
    var url = _ref$url === undefined ? 'https://slack.com/api/' : _ref$url;

    _classCallCheck(this, Slack);

    this.token = token;
    this.DEFAULT_TIMEOUT = timeout;
    this.DEFAULT_MAX_ATTEMPTS = maxAttempts;
    this.webhooks = [];
    if (webhooks && (0, _validate.validateWebhooks)(webhooks)) {
      this.webhooks = _lodash2.default.cloneDeep(webhooks);
    }
    if (webhooks && !_lodash2.default.isArray(webhooks) && _lodash2.default.isString(webhooks)) {
      this.webhooks = [_lodash2.default.cloneDeep(webhooks)];
    }
    this.url = url;
  }

  /**
   * Adding webhooks to the current webhook storage
   * @param {String | String[]} webhooks Webhook URL or
   * URLs which should be added to the current storage.
   * @return {Object} Returns the instance from the class.
   */


  _createClass(Slack, [{
    key: 'addWebhooks',
    value: function addWebhooks(webhooks) {
      var _this = this;

      (0, _validate.validateWebhooks)(webhooks);
      if (_lodash2.default.isArray(webhooks)) {
        _lodash2.default.forEach(webhooks, function (webhook) {
          return _this.webhooks.push(webhook);
        });
        return this;
      } else if (_lodash2.default.isString(webhooks)) {
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

  }, {
    key: 'setWebhooks',
    value: function setWebhooks(webhooks) {
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

  }, {
    key: 'removeWebhooks',
    value: function removeWebhooks(webhooks) {
      var _this2 = this;

      if (_lodash2.default.isArray(webhooks)) {
        _lodash2.default.forEach(webhooks, function (webhook) {
          _this2.webhooks = _lodash2.default.filter(_this2.webhooks, function (currentWebhook) {
            return currentWebhook !== webhook;
          });
        });
      } else if (_lodash2.default.isString(webhooks)) {
        this.webhooks = _lodash2.default.filter(this.webhooks, function (currentWebhook) {
          return currentWebhook !== webhooks;
        });
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

  }, {
    key: 'detectEmoji',
    value: function detectEmoji(emoji) {
      var obj = {
        key: 'icon_emoji',
        val: ''
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

  }, {
    key: 'webhook',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(options, cb) {
        var _this3 = this;

        var emoji, payload, responsePromises, responses;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                emoji = this.detectEmoji(options.iconEmoji);
                payload = {
                  response_type: options.response_type || 'ephemeral',
                  channel: options.channel || '#general',
                  text: options.text || '',
                  username: options.userName,
                  attachments: options.attachments
                };

                payload[emoji.key] = emoji.val;
                responsePromises = _lodash2.default.map(this.webhooks, function (webhook) {
                  return (0, _requestretry2.default)({
                    method: 'POST',
                    url: webhook,
                    body: JSON.stringify(payload),
                    timeout: _this3.timeout,
                    maxAttempts: _this3.maxAttempts,
                    retryDelay: 0,
                    json: true
                  });
                });
                _context.prev = 4;
                _context.next = 7;
                return Promise.all(responsePromises);

              case 7:
                responses = _context.sent;

                responses = _lodash2.default.map(responses, function (res) {
                  if (_lodash2.default.isString(res.body)) {
                    res.body = JSON.parse(res.body);
                  }
                  return res;
                });
                this.callbackIfValid(cb, null, responses);
                return _context.abrupt('return', responses);

              case 13:
                _context.prev = 13;
                _context.t0 = _context['catch'](4);

                this.callbackIfValid(cb, _context.t0);
                throw _context.t0;

              case 17:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[4, 13]]);
      }));

      function webhook(_x2, _x3) {
        return ref.apply(this, arguments);
      }

      return webhook;
    }()

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

  }, {
    key: 'api',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(method) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
        var callback = arguments[2];
        var opts, cb, requestArg, response;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                opts = options;
                cb = callback;
                requestArg = {
                  url: this.url + method,
                  timeout: this.timeout,
                  maxAttempts: this.maxAttempts,
                  retryDelay: 0,
                  json: true,
                  method: 'GET',
                  formData: {},
                  qs: {}
                };

                if (_lodash2.default.isFunction(options)) {
                  cb = options;
                }
                if (method === 'files.upload') {
                  requestArg.method = 'POST';
                  requestArg.formData = options;
                } else {
                  requestArg.qs = options;
                }
                _lodash2.default.assign(opts, { token: this.token });
                requestArg.formData = _lodash2.default.omitBy(requestArg.formData, _lodash2.default.isUndefined);
                _context2.prev = 7;
                _context2.next = 10;
                return (0, _requestretry2.default)(requestArg);

              case 10:
                response = _context2.sent;

                this.callbackIfValid(cb, null, response);
                return _context2.abrupt('return', response);

              case 15:
                _context2.prev = 15;
                _context2.t0 = _context2['catch'](7);

                this.callbackIfValid(cb, _context2.t0);
                throw _context2.t0;

              case 19:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[7, 15]]);
      }));

      function api(_x4, _x5, _x6) {
        return ref.apply(this, arguments);
      }

      return api;
    }()

    /**
     * Function which is handling callbacks if
     * they are avaliable.
     * @param  {Function} cb       Optional callback functionality
     * @param  {Object}   err      Error object.
     * @param  {Object}   response Response object.
     * @return {void} Returns nothing.
     */

  }, {
    key: 'callbackIfValid',
    value: function callbackIfValid(cb, err, response) {
      if (_lodash2.default.isFunction(cb)) {
        cb(err, response); // eslint-disable-line
      }
    }
  }]);

  return Slack;
}();