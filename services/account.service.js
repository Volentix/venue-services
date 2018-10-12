"use strict";

module.exports = {
  name: "account",

  /**
   * Service settings
   */
  settings: {},

  /**
   * Service dependencies
   */
  dependencies: [],

  /**
   * Actions
   */
  actions: {
    /**
     * Set wallet
     *
     * @param {String} userId - The ID of the user who owns the wallet
     * @param {String} address - The address of the wallet
     */
    setWallet: {
      params: {
        userId: "string",
        address: "string"
      },
      handler(ctx) {
        return { userId: ctx.params.userId, address: ctx.params.address };
      }
    },
    getWallet: {
      params: {
        userId: "string"
      },
      handler() {
        return { address: "abc" };
      }
    }
  },

  /**
   * Events
   */
  events: {},

  /**
   * Methods
   */
  methods: {},

  /**
   * Service created lifecycle event handler
   */
  created() {},

  /**
   * Service started lifecycle event handler
   */
  started() {},

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {}
};
