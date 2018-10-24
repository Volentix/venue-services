"use strict";

const { MoleculerClientError } = require("moleculer").Errors;

const axios = require("axios");
const jwt = require("jsonwebtoken");

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
    fields: ["user_profile_id", "username", "email", "language"],

    /** Validator schema for entity */
    entityValidator: {
      username: { type: "string", min: 2, pattern: /^[a-zA-Z0-9]+$/ },
      password: { type: "string", min: 6 },
      email: { type: "email" },
      bio: { type: "string", optional: true },
      image: { type: "string", optional: true }
    }
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
        user: {
          type: "object",
          props: {
            username: { type: "string" },
            password: { type: "string", min: 1 }
          }
        }
      },
      async handler(ctx) {
        let user;
        try {
          user = await axios.post(
            // TODO Configure this
            "https://venue-uat.volentix.io/api/authenticate/",
            ctx.params.user
          );
        } catch (err) {
          throw new MoleculerClientError(
            "Failure with remote authentication",
            err.response.status,
            "",
            err.response.data
          );
        }

        if (!user || !user.data || !user.data.success) {
          throw new MoleculerClientError(
            "Username or password is invalid!",
            422,
            "",
            [{ field: "username", message: "is not found" }]
          );
        }

        // Transform user entity (remove password and all protected fields)
        return this.transformDocuments(ctx, {}, user.data).then(user =>
          this.transformEntity(user, true, ctx.meta.token)
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
    },

    /**
     * Get current user entity.
     * Auth is required!
     *
     * @actions
     *
     * @returns {Object} User entity
     */
    me: {
      auth: "required",
      cache: {
        keys: ["#userID"]
      },
      handler(ctx) {
        return this.getById(ctx.meta.user._id)
          .then(user => {
            if (!user)
              return this.Promise.reject(
                new MoleculerClientError("User not found!", 400)
              );

            return this.transformDocuments(ctx, {}, user);
          })
          .then(user => this.transformEntity(user, true, ctx.meta.token));
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
          id: user.user_profile_id,
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
        //user.image = user.image || "https://www.gravatar.com/avatar/" + crypto.createHash("md5").update(user.email).digest("hex") + "?d=robohash";
        //user.image = user.image || "";
        if (withToken) user.token = token || this.generateJWT(user);
      }

      return { user };
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
