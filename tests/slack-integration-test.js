import chai from 'chai';
import Chance from 'chance';
import restify from 'restify';
import spies from 'chai-spies';

chai.use(spies);

import { Slack } from '../src';

const expect = chai.expect;
const chance = new Chance();


describe('Slack integration tests', () => {
  before(async function () {
    this.timeout(12000);
    this.server = restify.createServer();
    this.port = 3000;
    this.domain = 'http://localhost';
    this.mockUrl = `${this.domain}:${this.port}/webhook`;
    this.server.use(restify.bodyParser());
    this.server.use(restify.queryParser());
    this.server.post('/webhook', (req, res) => res.json(req.body));
    this.server.post('/webhook/files.upload', (req, res) => res.json(req.body));
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
      this.timeout(12000);
      const slack = new Slack({ webhooks: this.mockUrl });
      const webhookOptions = {
        channel: chance.word(),
        text: chance.sentence(),
        username: chance.word(),
      };
      const spy = chai.spy(() => {});
      const [res] = await slack.webhook(webhookOptions, spy);
      const body = res.body;
      expect(spy).to.have.been.called;
      expect(body).to.have.property('channel', webhookOptions.channel);
      expect(body).to.have.property('text', webhookOptions.text);
      expect(body).to.have.property('username', webhookOptions.username);
    });

    it('should be able to push messages to multiple webhooks', async function () {
      this.timeout(12000);
      const slack = new Slack({ webhooks: [this.mockUrl, this.mockUrl] });
      const webhookOptions = {
        channel: chance.word(),
        text: chance.sentence(),
        username: chance.word(),
      };
      const spy = chai.spy((err, arrayOfResponses) => {
        expect(err).not.to.be.ok;
        expect(arrayOfResponses).to.be.an('array');
      });
      const [firstRes, secondRes] = await slack.webhook(webhookOptions, spy);
      const firstBody = firstRes.body;
      const secondBody = secondRes.body;
      expect(spy).to.have.been.called;
      expect(firstBody).to.have.property('channel', webhookOptions.channel);
      expect(firstBody).to.have.property('text', webhookOptions.text);
      expect(firstBody).to.have.property('username', webhookOptions.username);
      expect(secondBody).to.have.property('channel', webhookOptions.channel);
      expect(secondBody).to.have.property('text', webhookOptions.text);
      expect(secondBody).to.have.property('username', webhookOptions.username);
    });

    it('should throw error if one of the webhooks is invalid', async function () {
      this.timeout(12000);
      const slack = new Slack({ webhooks: [chance.url(), this.mockUrl] });
      const webhookOptions = {
        channel: chance.word(),
        text: chance.sentence(),
        username: chance.word(),
      };
      const spy = chai.spy((err) => expect(err).to.have.property('message'));
      try {
        await slack.webhook(webhookOptions, spy);
        expect(slack).not.to.be.ok;
      } catch (e) {
        expect(e).to.be.ok;
        expect(e).to.have.property('message');
        expect(spy).to.have.been.called;
      }
    });
  });

  describe('API tests', () => {
    it('should be able to get data from API', async function () {
      this.timeout(12000);
      const spy = chai.spy((err) => expect(err).not.be.ok);
      const slack = new Slack({ webhooks: chance.url(), url: this.mockUrl });
      const res = await slack.api('/method', spy);
      expect(res).to.be.ok;
      expect(res).to.have.property('statusCode', 200);
      expect(res.body).to.have.property('property');
      expect(spy).to.have.been.called;
    });

    it('should be able to get data from API with query as well', async function () {
      this.timeout(12000);
      const spy = chai.spy((err) => expect(err).not.be.ok);
      const slack = new Slack({ webhooks: chance.url(), url: this.mockUrl });
      const res = await slack.api('/method', { query: chance.integer() }, spy);
      expect(res).to.be.ok;
      expect(res).to.have.property('statusCode', 200);
      expect(res.body).to.have.property('query');
      expect(spy).to.have.been.called;
    });

    it('should be able to post data to API', async function () {
      this.timeout(12000);
      const spy = chai.spy((err) => expect(err).not.be.ok);
      const slack = new Slack({ webhooks: chance.url(), url: this.mockUrl + '/', token: chance.string() });
      const res = await slack.api('files.upload', { query: chance.integer() }, spy);
      expect(res).to.be.ok;
      expect(res).to.have.property('statusCode', 200);
      expect(res.body).to.have.property('query');
      expect(res.body).to.have.property('token');
      expect(spy).to.have.been.called;
    });

    it('should not be able to send undefined property', async function () {
      this.timeout(12000);
      const spy = chai.spy((err) => expect(err).not.be.ok);
      const slack = new Slack({ webhooks: chance.url(), url: this.mockUrl + '/' });
      const res = await slack.api('files.upload', { query: chance.integer() }, spy);
      expect(res).to.be.ok;
      expect(res).to.have.property('statusCode', 200);
      expect(res.body).to.have.property('query');
      expect(res.body).not.to.have.property('token');
      expect(spy).to.have.been.called;
    });
  });
});
