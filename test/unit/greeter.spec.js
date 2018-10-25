"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const TestService = require("../../services/greeter.service");

describe("Test 'greeter' service", () => {
  let broker = new ServiceBroker({
    logLevel: "warning"
  });
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'greeter.hello' action", () => {
    it("should return with 'Hello Moleculer'", () => {
      return expect(broker.call("greeter.hello")).resolves.toBe(
        "Hello Moleculer"
      );
    });
  });

  describe("Test 'greeter.welcome' action", () => {
    it("should return with 'Welcome'", () => {
      return expect(
        broker.call("greeter.welcome", { name: "Adam" })
      ).resolves.toBe("Welcome, Adam");
    });

    it("should reject an ValidationError", () => {
      return expect(broker.call("greeter.welcome")).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });
});
