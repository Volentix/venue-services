"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const TestService = require("../../services/constant-contact.service");

const faker = require("faker");
const axios = require("axios");

describe("Test 'constant-contact' service", () => {
  let broker = new ServiceBroker({
    logLevel: "warning"
  });
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
      axios.post.mockName("POST").mockResolvedValue({
        status: 201,
        data: {
          id: fakeCcId
        }
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
        },
        {
          params: {
            action_by: "ACTION_BY_OWNER"
          }
        }
      );
    });

    // TODO Handle bad result from constant contact

    it("should reject a ValidationError if no data provided", () => {
      return expect(broker.call("constant-contact.add")).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });

  describe("Test 'constant-contact.modify' action", () => {
    it("should return with ID returned from constant contact", async () => {
      const oldEmail = faker.internet.email();
      const fakeCCUser = {
        id: fakeCcId,
        lists: [
          {
            id: "1360368441"
          }
        ],
        email_addresses: [
          {
            email_address: oldEmail
          }
        ],
        moreData: faker.random.words()
      };

      axios.get.mockName("GET").mockResolvedValue({
        status: 200,
        data: {
          results: [fakeCCUser]
        }
      });
      axios.put.mockResolvedValue({
        status: 200
      });

      await expect(
        broker.call("constant-contact.modify", {
          user: { email: fakeEmail },
          oldEmail
        })
      ).resolves.toEqual(
        expect.objectContaining({
          id: fakeCcId,
          user: expect.objectContaining({
            email: fakeEmail
          })
        })
      );

      expect(axios.get).toHaveBeenCalledWith(
        "https://api.constantcontact.com/v2/contacts",
        {
          params: {
            email: oldEmail
          }
        }
      );

      return expect(axios.put).toHaveBeenCalledWith(
        "https://api.constantcontact.com/v2/contacts/" + fakeCcId,
        Object.assign(fakeCCUser, {
          email_addresses: [
            {
              // FIXME Even when this doesn't match, the test passes!!!
              email_address: fakeEmail
            }
          ]
        }),
        {
          params: {
            action_by: "ACTION_BY_OWNER"
          }
        }
      );
    });

    describe("Test 'constant-contact.modify' action with multiple emails returned", () => {
      it("should return with ID returned from constant contact", async () => {
        const oldEmail = faker.internet.email();
        const anotherEmail = faker.internet.email();
        const fakeCCUser = {
          id: fakeCcId,
          lists: [
            {
              id: "1360368441"
            }
          ],
          email_addresses: [
            {
              email_address: oldEmail
            },
            {
              email_address: anotherEmail
            }
          ],
          moreData: faker.random.words()
        };

        axios.get.mockName("GET").mockResolvedValue({
          status: 200,
          data: {
            results: [fakeCCUser]
          }
        });
        axios.put.mockName("PUT").mockResolvedValue({
          status: 200
        });

        await expect(
          broker.call("constant-contact.modify", {
            user: { email: fakeEmail },
            oldEmail
          })
        ).resolves.toEqual(
          expect.objectContaining({
            id: fakeCcId,
            user: expect.objectContaining({
              email: fakeEmail
            })
          })
        );

        expect(axios.get).toHaveBeenCalledWith(
          "https://api.constantcontact.com/v2/contacts",
          {
            params: {
              email: oldEmail
            }
          }
        );

        return expect(axios.put).toHaveBeenCalledWith(
          "https://api.constantcontact.com/v2/contacts/" + fakeCcId,
          Object.assign(fakeCCUser, {
            email_addresses: [
              {
                email_address: fakeEmail
              },
              {
                email_address: anotherEmail
              }
            ]
          }),
          {
            params: {
              action_by: "ACTION_BY_OWNER"
            }
          }
        );
      });
    });

    it("should reject a ValidationError if no data provided", () => {
      return expect(broker.call("constant-contact.add")).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });
});
