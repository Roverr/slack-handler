import restify from 'restify';
import Chance from 'chance';
import { expect } from 'chai';
import { Slack } from '../src';

const chance = new Chance();


describe('Slack webhooks integration tests', () => {
  before(async function () {
    this.timeout(8000);
    this.server = restify.createServer();
    this.port = 3000;
    this.domain = 'http://localhost';
    this.mockUrl = `${this.domain}:${this.port}/webhook`;
    this.server.use(restify.bodyParser());
    this.server.post('/webhook', (req, res) => res.json(req.body));
    await new Promise((res) => {
      this.server.listen(this.port, res);
    });
  });

  after(function() {
    this.server.close();
  });

  it('should be able to push messages to webhooks', async function () {
    const slack = new Slack({ webhooks: this.mockUrl });
    const webhookOptions = {
      channel: chance.word(),
      text: chance.sentence(),
      username: chance.word(),
    };
    const [res] = await slack.webhook(webhookOptions);
    const body = res.body;
    expect(body).to.have.property('channel', webhookOptions.channel);
    expect(body).to.have.property('text', webhookOptions.text);
    expect(body).to.have.property('username', webhookOptions.username);
  });

  it('should be able to push messages to multiple webhooks', async function () {
    const slack = new Slack({ webhooks: [this.mockUrl, this.mockUrl] });
    const webhookOptions = {
      channel: chance.word(),
      text: chance.sentence(),
      username: chance.word(),
    };
    const [firstRes, secondRes] = await slack.webhook(webhookOptions);
    const firstBody = firstRes.body;
    const secondBody = secondRes.body;
    expect(firstBody).to.have.property('channel', webhookOptions.channel);
    expect(firstBody).to.have.property('text', webhookOptions.text);
    expect(firstBody).to.have.property('username', webhookOptions.username);
    expect(secondBody).to.have.property('channel', webhookOptions.channel);
    expect(secondBody).to.have.property('text', webhookOptions.text);
    expect(secondBody).to.have.property('username', webhookOptions.username);
  });
});
