"use strict";

const { MoleculerClientError } = require("moleculer").Errors;

const axios = require("axios");

const CONSTANT_CONTACT_URI = "https://api.constantcontact.com/v2";

// Constant Contact list "Venue webapp"
const VENUE_LIST_ID = "1360368441";

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
        let newContact;
        try {
          newContact = await axios.post(CONSTANT_CONTACT_URI + "/contacts", {
            email_addresses: [
              {
                email_address: ctx.params.user.email
              }
            ],
            lists: [
              {
                id: VENUE_LIST_ID
              }
            ]
          });
        } catch (err) {
          // console.error(err);
          throw new MoleculerClientError(
            "Failure with remote call",
            err.response.status,
            "",
            err.response.data
          );
        }

        return Object.assign({}, ctx.params, newContact);
      }
    }
  }
};
