"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const TestService = require("../../services/account.service");

describe("Test 'account' service", () => {
  let broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'account.setWallet' action", () => {
    it("should return the wallet which is passed", async () => {
      return expect(
        broker.call("account.setWallet", { userId: "1", address: "abc" })
      ).resolves.toEqual({ userId: "1", address: "abc" });
    });

    it("should set the wallet which is returned with get", async () => {
      await broker.call("account.setWallet", { userId: "1", address: "abc" });
      return expect(
        broker.call("account.getWallet", { userId: "1" })
      ).resolves.toEqual({
        address: "abc"
      });
    });

    it("should reject an ValidationError", () => {
      expect(broker.call("account.setWallet")).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });
});
