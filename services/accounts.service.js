"use strict";

const DbService = require("../mixins/db.mixin");
const CacheCleanerMixin = require("../mixins/cache.cleaner.mixin");

/**
 * Account Service contains the number of tokens that the user is owed.
 */
module.exports = {
  name: "accounts",
  mixins: [
    DbService("accounts"),
    CacheCleanerMixin(["cache.clean.users", "cache.clean.follows"])
  ],

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
      async handler(ctx) {
        await this.adapter.insert(ctx.params);

        return { userId: ctx.params.userId, address: ctx.params.address };
      }
    },
    getWallet: {
      params: {
        userId: "string"
      },
      async handler(ctx) {
        const address = await this.adapter.findOne(ctx.params);
        return address;
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
