/**
 * Module dependencies.
 */
var util = require('util')
    , OAuthStrategy = require('passport-oauth').OAuthStrategy
    , InternalOAuthError = require('passport-oauth').InternalOAuthError;


/**
 * `Strategy` constructor.
 *
 * The Atlassian Oauth authentication strategy authenticates requests by delegating to
 * an Atlassian application using the OAuth 1.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts a `token`,
 * `tokenSecret` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occurred, `err` should be set.
 * 
 * Options:
 *   - `applicationURL` your Atlassian application URL
 *   - `consumerKey`  the OAuth consumer key configured in application links in your Atlassian application
 *   - `consumerSecret`  the RSA private key used to sign OAuth requests.  The Atlassian apps OAuth public key must match
 *
 * Examples:
 *
 *     passport.use(new AtlassianOAuthStrategy({
 *         applicationURL:"http://jira.atlassian.com",
 *         consumerKey:"sample-nodejs-app",
 *         consumerSecret:"<RSA-PRIVATE-KEY PEM encoded>",
 *       },
 *       function(token, tokenSecret, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
    options = options || {};
    if (!options.applicationURL)  throw new Error('Atlassian Oauth Strategy requires a applicationURL option');
    if (!options.callbackURL)  throw new Error('Atlassian Oauth Strategy requires a callbackURL option');

    options.requestTokenURL = options.requestTokenURL || options.applicationURL + '/plugins/servlet/oauth/request-token';
    options.accessTokenURL = options.accessTokenURL || options.applicationURL + '/plugins/servlet/oauth/access-token';
    options.userAuthorizationURL = options.userAuthorizationURL || options.applicationURL + '/plugins/servlet/oauth/authorize';
    options.signatureMethod = options.signatureMethod || "RSA-SHA1";

    OAuthStrategy.call(this, options, verify);
    this.name = 'atlassian-oauth';
    this._applicationURL = options.applicationURL;
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuthStrategy);


/**
 * Retrieve user profile from the Atlassian Application.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `atlassian-oauth`
 *   - `id`               the user's username
 *   - `username`         the user's username
 *   - `displayName`      the user's full name
 *   - `avatarUrls`      the user's avatar URLs for different sized avatar images provided by the Atlassian app
 *   - `timeZone`       the user's timezone
 *   - `emails`           the proxied or contact email address granted by the user
 *   - `groups`         the user's group memberhips
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function (token, tokenSecret, params, done) {
    var self = this;
    self._oauth._performSecureRequest(token, tokenSecret, "GET", this._applicationURL + "/rest/auth/1/session", null, "", "application/json", function (err, body, res) {
        if (err) {
            return done(new InternalOAuthError('failed to fetch user profile', err));
        }

        try {
            var json = JSON.parse(body);

            var jiraProfileResource = self._applicationURL + "/rest/api/2/user?expand=groups&username=" + json.name;
            self._oauth._performSecureRequest(token, tokenSecret, "GET", jiraProfileResource, null, "", "application/json", function (err, body, res) {
                if (err) {
                    return done(new InternalOAuthError('failed to fetch user profile', err));
                }

                try {
                    var json = JSON.parse(body);
                    var profile = { provider:'atlassian-oauth' };
                    profile.id = json.name;
                    profile.username = json.name;
                    profile.displayName = json.displayName;
                    profile.avatarUrls = json.avatarUrls;
                    profile.timeZone = json.timeZone;
                    profile.emails = [
                        { value:json.emailAddress }
                    ];

                    var groups = [];
                    for (var i = 0; i < json.groups.items.length; i++) {
                        groups.push(json.groups.items[i].name);
                    }
                    profile.groups = groups;

                    profile._raw = body;
                    profile._json = json;
                    done(null, profile);
                } catch (e) {
                    done(e);
                }
            });
        } catch (e) {
            done(e);
        }
    });
};


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
