"use strict";

const _ = require("lodash");
const { MoleculerClientError } = require("moleculer").Errors;

const axios = require("axios");
const jwt = require("jsonwebtoken");
const HttpStatus = require("http-status-codes");

const DbService = require("../mixins/db.mixin");
const CacheCleanerMixin = require("../mixins/cache.cleaner.mixin");

module.exports = {
  name: "users",
  mixins: [
    DbService("users"),
    CacheCleanerMixin(["cache.clean.users", "cache.clean.follows"])
  ],

  /**
   * Default settings
   */
  settings: {
    /** Secret for JWT */
    JWT_SECRET:
      process.env.JWT_SECRET || "-]CMHc[CF'CDUi^5-aQevpVdZe}7(S/Ps2jyi'e2",

    /** Public fields */
    fields: ["_id", "username", "email", "language"]
  },

  /**
   * Actions
   */
  actions: {
    /**
     * Login with username & password
     *
     * @actions
     * @param {Object} user - User credentials
     *
     * @returns {Object} Logged in user with token
     */
    login: {
      params: {
        authServer: { type: "url" },
        user: {
          type: "object",
          props: {
            username: { type: "string" },
            password: { type: "string", min: 1 }
          }
        }
      },
      async handler(ctx) {
        let res;
        res = await axios.post(
          ctx.params.authServer + "/api/authenticate/",
          ctx.params.user
        );
        if (res.status !== HttpStatus.OK) {
          throw this.makeRemoteError(res);
        }

        if (!res.data.success) {
          throw new MoleculerClientError(
            "Username or password is invalid!",
            422,
            "",
            [{ field: "username", message: "is not found" }]
          );
        }

        // The name "user_profile_id" is ugly; replace with "_id"
        const entity = _.mapKeys(
          res.data,
          (v, k) => (k === "user_profile_id" ? "_id" : k)
        );

        // Store the user locally so that it can be found in resolveToken
        if (!(await this.getById(entity._id))) {
          await this.adapter.insert(entity);
        }

        return this.transformDocuments(ctx, {}, entity)
          .then(user => this.transformEntity(user, true, ctx.meta.token))
          .then(json =>
            this.entityChanged("created", json, ctx).then(() => json)
          );
      }
    },

    /**
     * Get user by JWT token (for API GW authentication)
     *
     * @actions
     * @param {String} token - JWT token
     *
     * @returns {Object} Resolved user
     */
    resolveToken: {
      cache: {
        keys: ["token"],
        ttl: 60 * 60 // 1 hour
      },
      params: {
        token: "string"
      },
      handler(ctx) {
        return new this.Promise((resolve, reject) => {
          jwt.verify(
            ctx.params.token,
            this.settings.JWT_SECRET,
            (err, decoded) => {
              if (err) return reject(err);

              resolve(decoded);
            }
          );
        }).then(decoded => {
          if (decoded.id) return this.getById(decoded.id);
        });
      }
    }
  },
  /**
   * Methods
   */
  methods: {
    /**
     * Generate a JWT token from user entity
     *
     * @param {Object} user
     */
    generateJWT(user) {
      const today = new Date();
      const exp = new Date(today);
      exp.setDate(today.getDate() + 60);

      return jwt.sign(
        {
          id: user._id,
          username: user.username,
          exp: Math.floor(exp.getTime() / 1000)
        },
        this.settings.JWT_SECRET
      );
    },

    /**
     * Transform returned user entity. Generate JWT token if neccessary.
     *
     * @param {Object} user
     * @param {Boolean} withToken
     */
    transformEntity(user, withToken, token) {
      if (user) {
        if (withToken) user.token = token || this.generateJWT(user);
      }

      return { user };
    },
    makeRemoteError(resp) {
      return new MoleculerClientError(
        "Failure calling " + resp.request.url,
        resp.status,
        "remote-failure",
        resp.data
      );
    }
  },
  events: {
    "cache.clean.users"() {
      if (this.broker.cacher) this.broker.cacher.clean(`${this.name}.*`);
    },
    "cache.clean.follows"() {
      if (this.broker.cacher) this.broker.cacher.clean(`${this.name}.*`);
    }
  }
};
