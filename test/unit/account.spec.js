"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const TestService = require("../../services/account.service");

const faker = require("faker");

describe("Test 'account' service", () => {
  let broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'account.setWallet' action", () => {
    it("should return the wallet which is passed", async () => {
      const userId = faker.random.word();
      const address = faker.random.uuid();
      return expect(
        broker.call("account.setWallet", { userId, address })
      ).resolves.toEqual(expect.objectContaining({ userId, address }));
    });

    it("should set the wallet which is returned with get", async () => {
      const userId = faker.random.word();
      const address = faker.random.uuid();
      await broker.call("account.setWallet", { userId, address });
      return expect(
        broker.call("account.getWallet", { userId })
      ).resolves.toEqual(expect.objectContaining({ userId, address }));
    });

    it("should reject an ValidationError", () => {
      expect(broker.call("account.setWallet")).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });
});
