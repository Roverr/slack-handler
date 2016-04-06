'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateWebhooks = validateWebhooks;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function validateWebhooks(webhooks) {
  var errorMsg = 'SlackHandler can only handle strings or array of strings. You provided: ';
  if (_lodash2.default.isArray(webhooks)) {
    _lodash2.default.forEach(webhooks, function (webhook) {
      if (!_lodash2.default.isString(webhook)) {
        throw new Error(errorMsg, { webhook: webhook });
      }
    });
    return true;
  } else if (_lodash2.default.isString(webhooks) && !_lodash2.default.isEmpty(webhooks)) {
    return true;
  }
  throw new Error(errorMsg, { webhooks: webhooks });
}