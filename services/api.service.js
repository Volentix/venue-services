"use strict";

const _ = require("lodash");
const ApiGateway = require("moleculer-web");
const { UnAuthorizedError } = ApiGateway.Errors;

module.exports = {
  name: "api",
  mixins: [ApiGateway],

  // More info about settings: https://moleculer.services/docs/0.13/moleculer-web.html
  settings: {
    port: process.env.PORT || 8080,

    routes: [
      {
        path: "/api",
        authorization: true,

        aliases: {
          "POST /users/login": "users.login",

          "POST /constant-contact/add": "constant-contact.add",
          "POST /constant-contact/modify": "constant-contact.modify"
        },

        // Disable to call not-mapped actions
        mappingPolicy: "restrict",
        // Parse body content
        bodyParsers: {
          json: {
            strict: false
          },
          urlencoded: {
            extended: false
          }
        }
      }
    ],

    // Serve assets from "public" folder
    assets: {
      folder: "public"
    },
    onError(req, res, err) {
      // Return with the error as JSON object
      res.setHeader("Content-type", "application/json; charset=utf-8");
      res.writeHead(err.code || 500);

      if (err.code == 422) {
        let o = {};
        err.data.forEach(e => {
          let field = e.field.split(".").pop();
          o[field] = e.message;
        });

        res.end(JSON.stringify({ errors: o }, null, 2));
      } else {
        const errObj = _.pick(err, ["name", "message", "code", "type", "data"]);
        res.end(JSON.stringify(errObj, null, 2));
      }
      this.logResponse(req, res, err ? err.ctx : null);
    }
  },
  methods: {
    /**
     * Authorize the request
     *
     * @param {Context} ctx
     * @param {Object} route
     * @param {IncomingRequest} req
     * @returns {Promise}
     */
    authorize(ctx, route, req) {
      let token;
      if (req.headers.authorization) {
        let type = req.headers.authorization.split(" ")[0];
        if (type === "Token" || type === "Bearer")
          token = req.headers.authorization.split(" ")[1];
      }

      return this.Promise.resolve(token)
        .then(token => {
          if (token) {
            console.log("***token", token);
            // Verify JWT token
            return ctx
              .call("users.resolveToken", { token })
              .then(user => {
                console.log("+++user", user);
                if (user) {
                  this.logger.info("Authenticated via JWT: ", user.username);
                  // Reduce user fields (it will be transferred to other nodes)
                  ctx.meta.user = _.pick(user, ["_id", "username", "email"]);
                  ctx.meta.token = token;
                  ctx.meta.userID = user._id;
                }
                return user;
              })
              .catch(() => {
                // Ignored because we continue processing if user is not exist
                return null;
              });
          }
        })
        .then(user => {
          if (req.$action.auth == "required" && !user)
            return this.Promise.reject(new UnAuthorizedError());
        });
    }
  }
};
