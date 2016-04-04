import restify from 'restify';
import Chance from 'chance';
import { expect } from 'chai';
import { Slack } from '../src';

const chance = new Chance();


describe('Slack integration tests', () => {
  before(async function () {
    this.timeout(8000);
    this.server = restify.createServer();
    this.port = 3000;
    this.domain = 'http://localhost';
    this.mockUrl = `${this.domain}:${this.port}/webhook`;
    this.server.use(restify.bodyParser());
    this.server.use(restify.queryParser());
    this.server.post('/webhook', (req, res) => res.json(req.body));
    this.server.get('/webhook/method', (req, res) => {
      if (req.params.query) {
        return res.json({ query: req.params.query });
      }
      return res.json({ property: chance.string() });
    });
    await new Promise((res) => {
      this.server.listen(this.port, res);
    });
  });

  after(function() {
    this.server.close();
  });

  describe('webhook tests', () => {
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

    it('should throw error if one of the webhooks is invalid', async function () {
      this.timeout(8000);
      const slack = new Slack({ webhooks: [chance.url(), this.mockUrl] });
      const webhookOptions = {
        channel: chance.word(),
        text: chance.sentence(),
        username: chance.word(),
      };
      try {
        await slack.webhook(webhookOptions);
        expect(slack).not.to.be.ok;
      } catch (e) {
        expect(e).to.be.ok;
        expect(e).to.have.property('message');
      }
    });
  });

  describe('API tests', () => {
    it('should be able to get data from API', async function () {
      const slack = new Slack({ webhooks: chance.url(), url: this.mockUrl });
      const res = await slack.api('/method');
      expect(res).to.be.ok;
      expect(res).to.have.property('statusCode', 200);
      expect(res.body).to.have.property('property');
    });

    it('should be able to get data from API with query as well', async function () {
      const slack = new Slack({ webhooks: chance.url(), url: this.mockUrl });
      const res = await slack.api('/method', { query: chance.integer() });
      expect(res).to.be.ok;
      expect(res).to.have.property('statusCode', 200);
      expect(res.body).to.have.property('query');
    });
  });
});
