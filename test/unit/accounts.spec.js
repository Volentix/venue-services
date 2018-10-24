"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const TestService = require("../../services/accounts.service");

const faker = require("faker");

describe("Test 'account' service", () => {
  let broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'accounts.setWallet' action", () => {
    it("should return the wallet which is passed", async () => {
      const userId = faker.random.uuid();
      const address = faker.random.uuid();
      return expect(
        broker.call("accounts.setWallet", { userId, address })
      ).resolves.toEqual(expect.objectContaining({ userId, address }));
    });

    it("should set the wallet which is returned with get", async () => {
      const userId = faker.random.uuid();
      const address = faker.random.uuid();
      await broker.call("accounts.setWallet", { userId, address });
      return expect(
        broker.call("accounts.getWallet", { userId })
      ).resolves.toEqual(expect.objectContaining({ userId, address }));
    });

    it("should reject an ValidationError", () => {
      expect(broker.call("accounts.setWallet")).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });
});
