# Another Slack messaging service
[ ![Codeship Status for Roverr/slack-handler](https://codeship.com/projects/d28f6580-db21-0133-0e50-561c728b2028/status?branch=master)](https://codeship.com/projects/143896)
[ ![Codacy Badge](https://api.codacy.com/project/badge/grade/7e1a46a35bb147a28140ee8469ce8c8e)](https://www.codacy.com/app/rover/slack-handler)

Service made for sending messages to webhooks, and handling API
requests towards slack. This service is mostly a "fork" version of
this: [clonn/slack-node-sdk](https://github.com/clonn/slack-node-sdk)

The differences:
* The original version of the code is written in CoffeeScript, which I do not like at all, so I did not want to contribute to the original version. However, most of the functionality is still the same, it just has been rewritten and refactored using [Babel](https://babeljs.io)

* This version is able to handle multiple webhooks. You can add new webhooks to the existing ones or remove which you would like to remove, or just set completely new ones.


## Why?
In my previous project, I had to use a Slack messaging service which happened to be the [original version](https://github.com/clonn/slack-node-sdk) of the repository. Although It worked great, I really missed the feature of being able to handle multiple webhooks. The solution for this problem was that I implemented it in my code, but I kind of felt like this would be a good feature in the existing package.

# How to use
## Handling multiple webhooks
### Creating instance
For creating an instance, you do not need anything.
```{js}
const Slack = require('slack-handler');
const API_TOKEN = process.env.YOUR_API_TOKEN;
const slack = new Slack({ token: API_TOKEN });
```
You can pass options object to the constructor with the following properties:
* __token__ - String - should be your API token, if you would like to make API calls.

* __timeout__ - Number - tracked in milliseconds, how much time the timeout lasts, before retrying your failed requests. __Default:   10 * 1000 ms  = 10 s__

* __maxAttempts__ - Number - indicates how many attempts should be made, before give up on a failed request. __Default: 3__

* __webhooks__ - String || String[] - webhooks which are used when posting to webhooks.

* __url__ - String - URL of the Slack API, if somehow you would like to use any other URL. __Default:  [https://slack.com/api](https://slack.com/api)__


### Adding webhooks
You can add your webhooks in the constructor:
```{js}
const Slack = require('slack-handler');
const webhook = process.env.MY_WEBHOOK;

// Notice here, that it can be a string
// or an array of strings

const slack = new Slack({
  webhooks: webhook,
});
```
Or you can add your potential webhooks after you created an instance from slack-handler, like this:
```{js}
const Slack = require('slack-handler');
const slack = new Slack();

/*
 * Stuff which is done by server.
 */

const myWebhooks = [webhook1, webhook2];
slack.addWebhooks(myWebhooks);

/*
 * And now you can push messages to these webhooks.
 */
```

### Removing webhooks
If there is an opporunity to add webhooks, there should be an opportunity to remove them:
```{js}
const Slack = require('slack-handler');
const webhook1 = process.env.MY_WEBHOOK_1;
const webhook2 = process.env.MY_WEBHOOK_2;
const slack = new Slack({ webhooks: [webhook1, webhook2] });

// Notice here, if your webhook2 was an array of strings,
// all of them will be removed here.

slack.removeWebhooks(webhook2);
```

### Setting webhooks
This method is where you can completely just set your webhooks. Let's say you have something in your slack-handler, but you do not want to remove them one by one and add your new webhooks array, than this is your function:
```{js}
const myNewArrayOfWebhooks = ['webhook1', 'webhook2'];
slack.setWebhooks(myNewArrayOfWebhooks);

// After this, you won't be able to send
// messages to your previously added webhooks.
```

## Sending messages to webhooks
First, you need valid webhooks. If one of your webhook is not valid or you are not getting any response from it, you are going to get an error. So you always want to make a catch at the end of your promise chain or handle error first callbacks:
```{js}
const Slack = require('slack-handler');
const webhook = process.env.MY_WEBHOOK;
const slack = new Slack({ webhooks: webhook });

const messageOptions = {
  channel: '#test',
  text: 'You cannot kill the battery!',
  userName: 'Metal bot',
};

slack.webhook(messageOptions).then((respones) => {
  // Notice here, that responses is
  // going to be an array, even if you
  // only have one webhook stored.
}).catch((e) => {
  // Handle errors
});

// Or you can go simply with the callback:

slack.webhook(messageOptions, (err, responses) => {
  if (err) {
    // Handle it
  }
  // Handle responses
});
```
Most of the properties in the options can be found on the website of Slack, so if you need more information about them, I suggest you visiting Slack's website first. In the options you can define:
* __response_type__ - String - This is probably do not need to be set by you, but here you can [read more](https://api.slack.com/slash-commands). __Default: ephemeral__

* __channel__ - String - Should be something like #general, this is going to be the name of the channel where your message will be sent to. __Default: '#general'__

* __text__ - String - Your message's text. __Default: '' (empty String)__

* __userName__ - String - This should be the user name which will be shown when the message is posted. This is a __must-have property__ when using webhooks.

* __attachments__ - Object || Array - Any type of attachments you want to include with your message. [Read more here.](https://api.slack.com/docs/attachments)

* __iconEmoji__ - String - This should be an existing emoji or a link to an image. __Default: '' (empty String)__

## API requests
Some of the API requests can only be done with valid token, so you should be prepared for it. [Read more about methods of Slack API.](https://api.slack.com/methods)


Instances of slack-handler have an api method, which can be used like this:
```{js}
const Slack = require('slack-handler');
const API_TOKEN = process.env.MY_SLACK_API_TOKEN;
const slack = new Slack({ token: API_TOKEN });

// With Promise
slack.api('api.test').then((response) => {
  // Notice here,
  // that response is not going to be an array
});

// With Callback
slack.api('api.test', (err, response) => {
  // Handle response here.
});
```
There is an options object, which can be given to the function like this:
```{js}
const Slack = require('slack-handler');
const API_TOKEN = process.env.MY_SLACK_API_TOKEN;
const slack = new Slack({ token: API_TOKEN });

const options = { json: true };

// With Promise
slack.api('api.test', options).then((response) => {
  // Notice here,
  // that response is not going to be an array
});

// With Callback
slack.api('api.test', options, (err, response) => {
  // Handle response here.
});
```
If you would like to use a callback, you should be aware that providing and options object, the callback will be the third parameter of the function.
However if you do not provide one, it will be the second parameter, so you __do not have to use__ like this:

```{js}
// WRONG!!!!
slack.api('api.test', undefined, (err, response) => {});
```

If you would like to __upload files__, your options object will be your form data, which is going to be sent to the Slack API.
Otherwise options can include any property, but they are going to be used as a query parameter.
For example you create an options object like this:
```{js}
const options = { json: true };
slack.api('api.test', options);
```
This will going to be a request like this:

__METHOD__ : GET

__URL__ : https://slack.com/api/api.test?json=true

## Run tests

* Clone the repository
* Checkout the branch you want to test (default: master)
* nvm use 4.4 (except if you do not have nvm or 4.4. than install them first)
* npm install
* npm test

# Issues

If you would like to report any issues, you can do it at the repository of the project. I will try to help as soon as I can.

Also __pull requests are welcomed.__

# Coming soon features

I have nothing serious in my mind yet, but ideas are welcomed as well.
