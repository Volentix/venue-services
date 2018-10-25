"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError, MoleculerClientError } = require("moleculer").Errors;
const TestService = require("../../services/users.service");

const faker = require("faker");
const axios = require("axios");

describe("Test 'users' service", () => {
  let broker = new ServiceBroker({
    logLevel: "warning"
  });
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  let fakeUrl;
  let fakeUsername;
  let fakePassword;
  beforeEach(() => {
    fakeUrl = faker.internet.url();
    fakeUsername = faker.internet.userName();
    fakePassword = faker.internet.password();
  });

  describe("Test 'users.login' action", () => {
    it("should return a token on success", () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          success: true,
          username: fakeUsername
        }
      });
      expect(
        broker.call("users.login", {
          authServer: fakeUrl,
          user: {
            username: fakeUsername,
            password: fakePassword
          }
        })
      ).resolves.toEqual(
        expect.objectContaining({
          user: expect.objectContaining({
            token: expect.any(String),
            username: fakeUsername
          })
        })
      );

      return expect(axios.post).toHaveBeenCalledWith(
        fakeUrl + "/api/authenticate/",
        {
          username: fakeUsername,
          password: fakePassword
        }
      );
    });

    it("should reject an MoleculerClientError on bad password", () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          success: false
        }
      });
      return expect(
        broker.call("users.login", {
          user: {
            username: fakeUsername,
            password: fakePassword
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
