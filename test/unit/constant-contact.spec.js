"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const TestService = require("../../services/constant-contact.service");

const faker = require("faker");
const axios = require("axios");
jest.mock("axios");

describe("Test 'constant-contact' service", () => {
  let broker = new ServiceBroker();
  broker.createService(TestService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  let fakeEmail;
  let fakeCcId;
  beforeEach(() => {
    fakeEmail = faker.internet.email();
    fakeCcId = faker.random.number();
  });

  describe("Test 'constant-contact.add' action", () => {
    it("should return with ID returned from constant contact", async () => {
      axios.post.mockResolvedValue({
        id: fakeCcId
      });
      await expect(
        broker.call("constant-contact.add", { user: { email: fakeEmail } })
      ).resolves.toEqual(
        expect.objectContaining({
          id: fakeCcId,
          user: expect.objectContaining({
            email: fakeEmail
          })
        })
      );

      return expect(axios.post).toHaveBeenCalledWith(
        "https://api.constantcontact.com/v2/contacts",
        {
          email_addresses: [
            {
              email_address: fakeEmail
            }
          ],
          lists: [
            {
              id: "1360368441"
            }
          ]
        }
      );
    });

    it("should reject a ValidationError if no data provided", () => {
      return expect(broker.call("constant-contact.add")).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });
});
