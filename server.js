var pug         = require('pug');
var nodemailer  = require('nodemailer');
var crypto      = require('crypto');
var settings    = require('./settings');

// Translation
var locale  = require('./locales/' + settings.language);
var lang    = locale.server;

// Web server
var bodyParser  = require('body-parser');
var cors        = require('cors');
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
// Allow cross-origin requests.
var corsOptions = {
  origin: settings.formOrigin,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
// Taking care of preflight requests
app.options('*', cors(corsOptions));


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
    // Response will be JSON
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    if(!checkBody(req.body)) {
        return res.status(400).send();
    }
    
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Token verification
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
        from: req.body.name + '<' + settings.mailserver.auth.user + '>',
        replyTo: req.body.name + ' <' + req.body.addr + '>',
        html: req.body.text
    };

    // Process custom fields to get data we can use in the HTML generation
    params.custom = processCustom(req.body.custom);
    
    // Replacing the mail's content with HTML from the pug template
    // Commenting the line below will bypass the generation and only user the
    // text entered by the user
    params.html = pug.renderFile('template.pug', params);
    
    log.info(lang.log_sending, params.replyTo);
    
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


// A request on /lang sends translated strings (according to the locale set in
// the app settings), alongside the boolean for the display of labels in the
// form block.
app.get('/lang', function(req, res, next) {
    // Response will be JSON
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // Preventing un-updated settings files
    let labels = true;
    if(settings.labels !== undefined) {
        labels = settings.labels;
    }
    
    // Send the infos
    res.status(200).send({
        'labels': labels,
        'translations': locale.client
    });
});


// A request on /fields sends data on custom fields.
app.get('/fields', function(req, res, next) {
	// Response will be JSON
    res.header('Access-Control-Allow-Headers', 'Content-Type');

	// Send an array anyway, its length will determine if we need to display any
	let customFields = settings.customFields || [];
	
	// Send custom fields data
	res.status(200).send(customFields);
});


// Use either the default port or the one chosen by the user (PORT env variable)
var port = process.env.PORT || 1970;
// Same for the host (using the HOST env variable)
var host = process.env.HOST || '0.0.0.0';
// Start the server
app.listen(port, host, function() {
    log.info(lang.log_server_start, host + ':' + port);
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
                sent();
                if(err) {
                    return update(err, recipient);
                }
                update(null, infos);
                // Promise callback
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
        log.info(lang.log_send_success, infos.accepted[0]);
    }
    if(infos.rejected.length !== 0) {
        status.failed++;
        log.info(lang.log_send_failure, infos.rejected[0]);
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
        log.warn(ip, lang.log_invalid_token);
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
    
    log.info(lang.log_cleared_token);
}


// Process custom fields to something usable in the HTML generation
// For example, this function replaces indexes with answers in select fields
// custom: object describing data from custom fields
// return: an object with user-input data from each field:
// {
//      field name: {
//          value: String,
//          label: String
//      }
// }
function processCustom(custom) {
    let fields = {};

    // Process each field
    for(let field in custom) {
        let type = settings.customFields[field].type;
        // Match indexes with data when needed
        switch(type) {
            case 'select':  custom[field] = settings.customFields[field]
                                            .options[custom[field]];
                            break;
        }
        // Insert data into the finale object
        fields[field] = {
            value: custom[field],
            label: settings.customFields[field].label
        }
    }
    
    return fields;
}