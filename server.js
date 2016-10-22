var pug         = require('pug');
var nodemailer  = require('nodemailer');
var crypto      = require('crypto');
var settings    = require('./settings');

// Web server
var bodyParser  = require('body-parser');
var express     = require('express');
var app = express();

// Logging
var printit = require('printit');
var log = printit({
    prefix: 'SMAM',
    date: true
});


// nodemailer initial configuration
var transporter = nodemailer.createTransport(settings.mailserver);


// Verification tokens
var tokens = {};


// Serve static (JS + HTML) files
app.use(express.static('front'));
// Body parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Allow cross-origin requests. Wildcard for now, we'll see if we can improve
// that.
app.all('/*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});


// A request on /register generates a token and store it, along the user's
// address, on the tokens object
app.get('/register', function(req, res, next) {
    // Get IP from express
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if(tokens[ip] === undefined) {
        tokens[ip] = [];
    }
    // Generate token
    crypto.randomBytes(10, (err, buf) => { 
        let token = buf.toString('hex');
        // Store and send the token
        tokens[ip].push({
            token: token,
            // A token expires after 12h
            expire: new Date().getTime() + 12 * 3600 * 1000
        });
        res.status(200).send(token);
    });
});


// A request on /send with user input = mail to be sent
app.post('/send', function(req, res, next) {
    if(!checkBody(req.body)) {
        return res.status(400).send();
    }
    
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    if(!checkToken(ip, req.body.token)) {
        return res.status(403).send();
    }
    
    // Count the failures
    let status = {
        failed: 0,
        total: settings.recipients.length
    };
    
    // params will be used as:
    // - values for html generation from the pug template
    // - parameters for sending the mail(s)
    let params = {
        subject: req.body.subj,
        from: req.body.name + ' <' + req.body.addr + '>',
        html: req.body.text
    };
    
    // Replacing the mail's content with HTML from the pug template
    // Commenting the line below will bypass the generation and only user the
    // text entered by the user
    params.html = pug.renderFile('template.pug', params);
    
    log.info('Sending message from ' + params.from);
    
    // Send the email to all users
    sendMails(params, function(err, infos) {
        if(err) {
            log.error(err);
        }
        logStatus(infos);
    }, function() {
        if(status.failed === status.total) {
            res.status(500).send();
        } else {
            res.status(200).send();
        }
    })
});


// Use either the default port or the one chosen by the user (PORT env variable)
var port = process.env.PORT || 1970;
// Same for the host (using the HOST env variable)
var host = process.env.HOST || '0.0.0.0';
// Start the server
app.listen(port, host, function() {
    log.info('Server started on ' + host + ':' + port);
});


// Run the clean every hour
var tokensChecks = setTimeout(cleanTokens, 3600 * 1000);


// Send mails to the recipients specified in the JSON settings file
// content: object containing mail params
//  {
//      subject: String
//      from: String (following RFC 1036 (https://tools.ietf.org/html/rfc1036#section-2.1.1))
//      html: String
//  }
// update(next, infos): Called each time a mail is sent with the infos provided
//                      by nodemailer
// done(): Called once each mail has been sent
function sendMails(params, update, done) {
    let mails = settings.recipients.map((recipient) => {
        // Promise for each recipient to send each mail asynchronously
        return new Promise((sent) => {
            params.to = recipient;
            // Send the email
            transporter.sendMail(params, (err, infos) => {
                if(err) {
                    return update(err, recipient);
                }
                update(null, infos);
                // Promise callback
                sent();
            });
        });
    });
    // Run all the promises (= send all the mails)
    Promise.all(mails).then(done);
}


// Produces log from the infos provided by nodemailer
// infos: infos provided by nodemailer
// return: nothing
function logStatus(infos) {
    if(infos.accepted.length !== 0) {
        log.info('Message sent to ' + infos.accepted[0]);
    }
    if(infos.rejected.length !== 0) {
        status.failed++;
        log.info('Message failed to send to ' + infos.rejected[0]);
    }
}


// Checks if the request's sender has been registered (and unregister it if not)
// ip: sender's IP address
// token: token used by the sender
// return: true if the user was registered, false else
function checkToken(ip, token) {
    let verified = false;
    
    // Check if there's at least one token for this IP
    if(tokens[ip] !== undefined) {
        if(tokens[ip].length !== 0) {
            // There's at least one element for this IP, let's check the tokens
            for(var i = 0; i < tokens[ip].length; i++) {
                if(!tokens[ip][i].token.localeCompare(token)) {
                    // We found the right token
                    verified = true;
                    // Removing the token
                    tokens[ip].pop(tokens[ip][i]);
                    break;
                }
            }
        } 
    }
    
    if(!verified) {
        log.warn(ip + ' just tried to send a message with an invalid token');
    }
    
    return verified;
}


// Checks if all the required fields are in the request body
// body: body taken from express's request object
// return: true if the body is valid, false else
function checkBody(body) {
    let valid = false;
    
    if(body.token !== undefined && body.subj !== undefined 
        && body.name !== undefined && body.addr !== undefined 
        && body.text !== undefined) {
        valid = true;
    }
    
    return valid;
}


// Checks the tokens object to see if no token has expired
// return: nothing
function cleanTokens() {
    // Get current time for comparison
    let now = new Date().getTime();
    
    for(let ip in tokens) { // Check for each IP in the object
        for(let token of tokens[ip]) { // Check for each token of an IP
            if(token.expire < now) { // Token has expired
                tokens[ip].pop(token);
            }
        }
        if(tokens[ip].length === 0) { // No more element for this IP
            delete tokens[ip];
        }
    }
    
    log.info('Cleared expired tokens');
}