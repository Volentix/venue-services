"use strict";
require("dotenv").config();

const { MoleculerClientError } = require("moleculer").Errors;

const HttpStatus = require("http-status-codes");

const CONSTANT_CONTACT_URI = "https://api.constantcontact.com/v2";

// Constant Contact list "Venue webapp"
const VENUE_LIST_ID = "1360368441";

const axios = require("axios").create({
  baseUrl: CONSTANT_CONTACT_URI,
  headers: {
    Authorization: "Bearer " + process.env.CONSTANT_CONTACT_ACCESS_TOKEN,
    "Content-Type": "application/json"
  },
  params: {
    api_key: process.env.CONSTANT_CONTACT_APP_KEY
  }
});

// axios.interceptors.request.use(request => {
//   console.log("Starting Request", JSON.stringify(request, null, 2));
//   return request;
// });

// axios.interceptors.response.use(response => {
//   console.log("Response:", response);
//   return response;
// });

module.exports = {
  name: "constant-contact",

  /**
   * Default settings
   */
  settings: {},

  /**
   * Actions
   */
  actions: {
    /**
     * Create a new Constant Contact entry
     *
     * @actions
     * @param {Object} user - User entity
     *
     * @returns {Object} Created contact
     */
    add: {
      params: {
        user: { type: "object" }
      },
      async handler(ctx) {
        const { user } = ctx.params;
        let res;
        try {
          res = await axios.post(
            CONSTANT_CONTACT_URI + "/contacts",
            {
              email_addresses: [
                {
                  email_address: user.email
                }
              ],
              lists: [
                {
                  id: VENUE_LIST_ID
                }
              ]
            },
            {
              params: {
                action_by: "ACTION_BY_OWNER"
              }
            }
          );
        } catch (error) {
          if (error.response.status === HttpStatus.CONFLICT) {
            throw new MoleculerClientError(
              "User with this email already exists"
            );
          }
          throw error;
        }

        if (res.status !== HttpStatus.CREATED) {
          throw this.makeRemoteError(res);
        }
        return Object.assign({}, { user }, { id: res.data.id });
      }
    },
    /**
     * Modify a new Constant Contact entry
     *
     * @actions
     * @param {Object} user - User entity
     *
     * @returns {Object} Created contact
     */
    modify: {
      params: {
        user: { type: "object" },
        oldEmail: { type: "email" }
      },
      async handler(ctx) {
        const { oldEmail, user } = ctx.params;

        const res = await axios.get(CONSTANT_CONTACT_URI + "/contacts", {
          params: {
            email: oldEmail
          }
        });

        if (res.status !== HttpStatus.OK) {
          throw this.makeRemoteError(res);
        }

        if (res.data.results.length <= 0) {
          throw new MoleculerClientError("User with given email not found");
        }

        const matchingContacts = res.data.results.filter(
          result =>
            result.lists.filter(list => list.id === VENUE_LIST_ID).length > 0
        );

        if (matchingContacts.length <= 0) {
          throw new MoleculerClientError("User not in Venue list");
        }

        // There should only be one
        const contact = matchingContacts[0];

        contact.email_addresses.filter(
          item => item.email_address === oldEmail
        )[0] = user.email;

        const res2 = await axios.put(
          CONSTANT_CONTACT_URI + "/contacts/" + contact.id,
          contact,
          {
            params: {
              action_by: "ACTION_BY_OWNER"
            }
          }
        );

        if (res2.status !== HttpStatus.OK) {
          throw this.makeRemoteError(res2);
        }

        return Object.assign({}, { user }, { id: contact.id });
      }
    }
  },
  /**
   * Methods
   */
  methods: {
    makeRemoteError(resp) {
      return new MoleculerClientError(
        "Failure calling " + resp.request.url,
        resp.status,
        "remote-failure",
        resp.data
      );
    }
  }
};
