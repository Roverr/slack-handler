import Chance from 'chance';
import { expect } from 'chai';
import { Slack } from '../src';

const chance = new Chance();

describe('Slack unit tests', () => {
  const errorMsg = 'SlackHandler can only handle strings or array of strings.';
  describe('creating an instance from Slack', () => {
    it('should be able to create an instance from Slack without webhooks', () => {
      const slack = new Slack();
      expect(slack).to.be.ok;
    });

    it('should not be able to create instance from Slack with incorrect type of webhooks', () => {
      try {
        const slack = new Slack({ webhooks: chance.integer() });
        expect(slack).not.to.be.ok;
      } catch (e) {
        expect(e.message).to.include(errorMsg);
      }
    });

    it('should not be able to create instance from Slack with incorrect type in webhooks array', () => {
      try {
        const slack = new Slack({ webhooks: [chance.url(), chance.integer()] });
        expect(slack).not.to.be.ok;
      } catch (e) {
        expect(e.message).to.include(errorMsg);
      }
    });

    it('should be able to create an instance from Slack with correct string webhooks', () => {
      const slack = new Slack({ webhooks: chance.url() });
      expect(slack).to.be.ok;
    });

    it('should be able to create an instance from Slack with correct array webhooks', () => {
      const slack = new Slack({ webhooks: [chance.url(), chance.url()] });
      expect(slack).to.be.ok;
    });
  });

  describe('adding webhooks to a Slack instance', () => {
    it('should not be able to add invalid webhooks type', () => {
      const slack = new Slack({ webhooks: chance.url() });
      const invalidType = chance.integer();
      try {
        slack.addWebhooks(invalidType);
        expect(slack).not.to.be.ok;
      } catch (e) {
        expect(e.message).to.include(errorMsg);
        expect(slack.webhooks).not.to.include(invalidType);
      }
    });

    it('should not be able to add invalid webhooks array', () => {
      const slack = new Slack({ webhooks: chance.url() });
      const invalidTypes = [chance.integer(), chance.bool()];
      try {
        slack.addWebhooks(invalidTypes);
        expect(slack).not.to.be.ok;
      } catch (e) {
        expect(e.message).to.include(errorMsg);
        const firstType = invalidTypes.pop();
        const secondType = invalidTypes.pop();
        expect(slack.webhooks).not.to.include(firstType);
        expect(slack.webhooks).not.to.include(secondType);
      }
    });

    it('should be able to add string webhooks', () => {
      const slack = new Slack({ webhooks: chance.url() });
      const validUrl = chance.url();
      slack.addWebhooks(validUrl);
      expect(slack.webhooks).to.include(validUrl);
    });

    it('should be able to add string array webhooks', () => {
      const slack = new Slack({ webhooks: chance.url() });
      const validUrls = [chance.url(), chance.url()];
      slack.addWebhooks(validUrls);
      const firstUrl = validUrls.pop();
      const secondUrl = validUrls.pop();
      expect(slack.webhooks).to.include(firstUrl);
      expect(slack.webhooks).to.include(secondUrl);
    });
  });

  describe('removing hooks from Slack instance', () => {
    it('should not be able to remove not existing hook', () => {
      const slack = new Slack({ webhooks: chance.url() });
      const url = chance.url();
      slack.removeWebhooks(url);
      expect(slack).to.be.ok;
      expect(slack.webhooks).not.to.include(url);
    });

    it('should be able to remove single urls', () => {
      const url = chance.url();
      const slack = new Slack({ webhooks: url });
      expect(slack.webhooks).to.include(url);
      slack.removeWebhooks(url);
      expect(slack.webhooks).not.to.include(url);
    });

    it('should be able to remove array of urls', () => {
      const url = [chance.url(), chance.url()];
      const slack = new Slack({ webhooks: url });
      const firstUrl = url[0];
      const secondUrl = url[1];
      expect(slack.webhooks).to.include(firstUrl);
      expect(slack.webhooks).to.include(secondUrl);
      slack.removeWebhooks(url);
      expect(slack.webhooks).not.to.include(firstUrl);
      expect(slack.webhooks).not.to.include(secondUrl);
    });

    it('should be able to chain removeWebhooks method', () => {
      const firstUrl = chance.url();
      const secondUrl = chance.url();
      const slack = new Slack({ webhooks: [firstUrl, secondUrl] });
      expect(slack.webhooks).to.include(firstUrl);
      expect(slack.webhooks).to.include(secondUrl);
      slack.removeWebhooks(firstUrl).removeWebhooks(secondUrl);
      expect(slack.webhooks).not.to.include(firstUrl);
      expect(slack.webhooks).not.to.include(secondUrl);
    });

    it('should be able to remove array of urls even if there is a non valid one in it', () => {
      const url = chance.url();
      const slack = new Slack({ webhooks: url });
      const invalidType = chance.integer();
      const arrayToRemove = [url, invalidType];
      expect(slack.webhooks).to.include(url);
      slack.removeWebhooks(arrayToRemove);
      expect(slack.webhooks).not.to.include(invalidType);
      expect(slack.webhooks).not.to.include(url);
    });
  });

  describe('setting webhooks in an existing Slack instance', () => {
    it('should not be able to set webhooks with invalid webhooks', () => {
      const slack = new Slack({ webhooks: chance.url() });
      try {
        slack.setWebhooks(chance.integer());
      } catch (e) {
        expect(e.message).to.include(errorMsg);
      }
    });

    it('should not be able to set webhooks with invalid webhooks', () => {
      const slack = new Slack({ webhooks: chance.url() });
      try {
        slack.setWebhooks(chance.integer());
      } catch (e) {
        expect(e.message).to.include(errorMsg);
      }
    });

    it('should not be able to set webhooks with invalid webhooks array', () => {
      const slack = new Slack({ webhooks: chance.url() });
      try {
        slack.setWebhooks([chance.integer(), chance.url()]);
      } catch (e) {
        expect(e.message).to.include(errorMsg);
        expect(slack.webhooks).to.be.empty;
      }
    });

    it('should be able to set webhooks with string webhooks', () => {
      const firstUrl = chance.url();
      const slack = new Slack({ webhooks: firstUrl });
      expect(slack.webhooks).to.include(firstUrl);
      const secondUrl = chance.url();
      slack.setWebhooks(secondUrl);
      expect(slack.webhooks).not.to.include(firstUrl);
      expect(slack.webhooks).to.include(secondUrl);
    });

    it('should be able to set webhooks with string array webhooks', () => {
      const firstUrl = chance.url();
      const slack = new Slack({ webhooks: firstUrl });
      expect(slack.webhooks).to.include(firstUrl);
      const secondUrl = chance.url();
      const thirdUrl = chance.url();
      slack.setWebhooks([secondUrl, thirdUrl]);
      expect(slack.webhooks).not.to.include(firstUrl);
      expect(slack.webhooks).to.include(secondUrl);
      expect(slack.webhooks).to.include(thirdUrl);
    });
  });

  describe('chaining webhook methods', () => {
    it('should be able to chain every multiple webhook related method', () => {
      const slack = new Slack({});
      expect(slack.webhooks).to.be.empty;
      const firstUrl = chance.url();
      const secondUrl = chance.url();
      slack.addWebhooks(firstUrl).removeWebhooks(firstUrl);
      expect(slack.webhooks).to.be.empty;
      slack.addWebhooks(firstUrl).setWebhooks(secondUrl);
      expect(slack.webhooks).not.to.include(firstUrl);
      expect(slack.webhooks).to.include(secondUrl);
      slack.setWebhooks([firstUrl, secondUrl]).removeWebhooks(firstUrl);
      expect(slack.webhooks).to.include(secondUrl);
      expect(slack.webhooks).not.to.include(firstUrl);
      slack.setWebhooks(firstUrl).setWebhooks(secondUrl);
      expect(slack.webhooks).to.include(secondUrl);
      expect(slack.webhooks).not.to.include(firstUrl);
    });
  });
});
