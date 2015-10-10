# Passport Atlassian OAuth

[Passport](http://passportjs.org/) strategy for authenticating with [Atlassian Applications](http://www.atlassian.com/)
using the OAuth 1.0 API.

This module lets you authenticate using Atlassian Applications in your Node.js applications.
By plugging into Passport, Atlassian Oauth authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Installation

    $ npm install passport-atlassian-oauth

## Usage

#### Configure Strategy

The Atlassian OAuth authentication strategy authenticates users using an Atlassian Application 
account and OAuth 1.0 tokens.  The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a applicationURL, consumerKey, and callback URL.

    passport.use(new AtlassianOAuthStrategy({
            applicationURL:"http://localhost:2990/jira",
            callbackURL:"http://localhost:5000/auth/atlassian-oauth/callback",
            consumerKey:"atlassian-oauth-sample",
            consumerSecret:"<RSA private key>",
      },
      function(token, tokenSecret, profile, done) {
        User.findOrCreate({ userid: profile.id }, function (err, user) {
          return done(err, user);
        });
      }
    ));

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'atlassian-oauth'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

    app.get('/auth/atlassian-oauth',
        passport.authenticate('atlassian-oauth'),
        function (req, res) {
            // The request will be redirected to the Atlassian app for authentication, so this
            // function will not be called.
        });
       
    app.get('/auth/atlassian-oauth/callback',
        passport.authenticate('atlassian-oauth', { failureRedirect:'/login' }),
        function (req, res) {
            res.redirect('/');
        });

#### Atlassian Application Setup

Configure an [application link](https://confluence.atlassian.com/display/JIRA/Configuring+Application+Links) in the 
Atlassian Application pointing back to your NodeJS app.

In this application link  configure [OAuth Authentication](https://confluence.atlassian.com/display/JIRA/Configuring+OAuth+Authentication+for+an+Application+Link) 
for incoming authentication.  Set the `consumer key` to the same value that you used in your AtlassianOAuthStrategy.
Provide a matching RSA public key for the private key in use in your NodeJS application and finally configure a callback
url that will redirect to `<NodeJS base URL>/auth/atlassian-oauth/callback` (given the example above). 


## Examples

For a complete, working example, refer to the [login example](https://bitbucket.org/knecht_andreas/passport-atlassian-oauth/src/master/examples/login).

## Issues

Currently this implementation only works with JIRA.  Unfortunately there isn't yet an Atlassian cross-product API to retrieve
user details to populate the passport profile that's the same in all applications. Other Atlassian applications may
be added at a later date (changing the REST calls in strategy.js ```userProfile()```).

## License

(The MIT License)

Copyright (c) 2012 Andreas Knecht

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.