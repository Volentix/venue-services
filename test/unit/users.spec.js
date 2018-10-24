"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError, MoleculerClientError } = require("moleculer").Errors;
const TestService = require("../../services/users.service");

describe("Test 'users' service", () => {
  let broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'users.login' action", () => {
    it("should return a token on success", () => {
      return expect(
        broker.call("users.login", {
          authServer: "https://venue-uat.volentix.io",
          user: {
            username: "thor",
            password: "default2018"
          }
        })
      ).resolves.toEqual(
        expect.objectContaining({
          user: expect.objectContaining({
            token: expect.any(String),
            username: "thor"
          })
        })
      );
    });

    it("should reject an MoleculerClientError on bad password", () => {
      return expect(
        broker.call("users.login", {
          user: {
            username: "thor",
            password: "badpassword"
          }
        })
      ).rejects.toBeInstanceOf(MoleculerClientError);
    });

    it("should reject an ValidationError on no data", () => {
      return expect(broker.call("users.login")).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });
});
