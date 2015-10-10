var express = require('express'),
    http = require('http'),
    passport = require('passport'),
    util = require('util'),
    AtlassianOAuthStrategy = require('../../').Strategy;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Atlassian profile is serialized
//   and deserialized.
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

var RsaPrivateKey = "-----BEGIN RSA PRIVATE KEY-----\n" +
    "MIICXQIBAAKBgQDizE4gQP5nPQhzof/Vp2U2DDY3UY/Gxha2CwKW0URe7McxtnmE\n" +
    "CrZnT1n/YtfrrCNxY5KMP4o8hMrxsYEe05+1ZGFT68ztms3puUxilU5E3BQMhz1t\n" +
    "JMJEGcTt8nZUlM4utli7fHgDtWbhvqvYjRMGn3AjyLOfY8XZvnFkGjipvQIDAQAB\n" +
    "AoGAKgk6FcpWHOZ4EY6eL4iGPt1Gkzw/zNTcUsN5qGCDLqDuTq2Gmk2t/zn68VXt\n" +
    "tVXDf/m3qN0CDzOBtghzaTZKLGhnSewQ98obMWgPcvAsb4adEEeW1/xigbMiaW2X\n" +
    "cu6GhZxY16edbuQ40LRrPoVK94nXQpj8p7w4IQ301Sm8PSECQQD1ZlOj4ugvfhEt\n" +
    "exi4WyAaM45fylmN290UXYqZ8SYPI/VliDytIlMfyq5Rv+l+dud1XDPrWOQ0ImgV\n" +
    "HJn7uvoZAkEA7JhHNmHF9dbdF9Koj86K2Cl6c8KUu7U7d2BAuB6pPkt8+D8+y4St\n" +
    "PaCmN4oP4X+sf5rqBYoXywHlqEei2BdpRQJBAMYgR4cZu7wcXGIL8HlnmROObHSK\n" +
    "OqN9z5CRtUV0nPW8YnQG+nYOMG6KhRMbjri750OpnYF100kEPmRNI0VKQIECQE8R\n" +
    "fQsRleTYz768ahTVQ9WF1ySErMwmfx8gDcD6jjkBZVxZVpURXAwyehopi7Eix/VF\n" +
    "QlxjkBwKIEQi3Ks297kCQQCL9by1bueKDMJO2YX1Brm767pkDKkWtGfPS+d3xMtC\n" +
    "KJHHCqrS1V+D5Q89x5wIRHKxE5UMTc0JNa554OxwFORX\n" +
    "-----END RSA PRIVATE KEY-----";

//Use this public key when configuring the Incoming authentication in the Applink in the 
//Atlassian application.
var RsaPublicKey = "-----BEGIN PUBLIC KEY-----\n" +
    "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDizE4gQP5nPQhzof/Vp2U2DDY3\n" +
    "UY/Gxha2CwKW0URe7McxtnmECrZnT1n/YtfrrCNxY5KMP4o8hMrxsYEe05+1ZGFT\n" +
    "68ztms3puUxilU5E3BQMhz1tJMJEGcTt8nZUlM4utli7fHgDtWbhvqvYjRMGn3Aj\n" +
    "yLOfY8XZvnFkGjipvQIDAQAB\n" +
    "-----END PUBLIC KEY-----";


// Use the AtlassianOauthStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Atlassian
//   profile), and invoke a callback with a user object.
passport.use(new AtlassianOAuthStrategy({
        applicationURL:"http://localhost:2990/jira",
        callbackURL:"http://localhost:5000/auth/atlassian-oauth/callback",
        consumerKey:"atlassian-oauth-sample",
        consumerSecret:RsaPrivateKey
    },
    function (token, tokenSecret, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {

            // To keep the example simple, the user's Atlassian profile is returned to
            // represent the logged-in user.  In a typical application, you would want
            // to associate the Atlassian account with a user record in your database,
            // and return that user instead.
            return done(null, profile);
        });
    }
));


var app = express();

// configure Express
app.configure(function () {
    app.set('port', process.env.PORT || 5000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({ secret:'keyboard cat' }));
    // Initialize Passport!  Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});


app.get('/', function (req, res) {
    res.render('index', { user:req.user });
});

app.get('/account', ensureAuthenticated, function (req, res) {
    res.render('account', { user:req.user });
});

app.get('/login', function (req, res) {
    res.render('login', { user:req.user });
});

// GET /auth/atlassian-oauth
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Atlassian authentication will involve
//   redirecting the user to the atlassian Oauth authorisation page.  After authorization, the Atlassian app will
//   redirect the user back to this application at /auth/atlassian-oauth
app.get('/auth/atlassian-oauth',
    passport.authenticate('atlassian-oauth'),
    function (req, res) {
        // The request will be redirected to the Atlassian app for authentication, so this
        // function will not be called.
    });

// GET /auth/atlassian-oauth/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/atlassian-oauth/callback',
    passport.authenticate('atlassian-oauth', { failureRedirect:'/login' }),
    function (req, res) {
        res.redirect('/');
    });

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login')
}
