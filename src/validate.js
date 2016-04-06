import _ from 'lodash';

export function validateWebhooks(webhooks) {
  const errorMsg = 'SlackHandler can only handle strings or array of strings. You provided: ';
  if (_.isArray(webhooks)) {
    _.forEach(webhooks, (webhook) => {
      if (!_.isString(webhook)) {
        throw new Error(errorMsg, { webhook });
      }
    });
    return true;
  } else if (_.isString(webhooks) && !_.isEmpty(webhooks)) {
    return true;
  }
  throw new Error(errorMsg, { webhooks });
}
