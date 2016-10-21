"use strict"
var pug         = require('pug');
var nodemailer  = require('nodemailer');
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

var transporter = nodemailer.createTransport(settings.mailserver);

// Serve static (JS + HTML) files
app.use(express.static('front'));
// Body parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// A request on /send with user input = mail to be sent
app.post('/send', function(req, res, next) {
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
    
    log.info('Sending message from ' + content.from);
    
    // Send the email to all users
    sendMails(params, function(err, infos) {
        if(err) {
            log.error(err)
        }
        logStatus(infos);
    }, function() {
        res.header('Access-Control-Allow-Origin', '*');
        res.status(200).send();
    })
});


// Use either the default port or the one chosen by the user (PORT env variable)
var port = process.env.PORT || 1970;
// Start the server
app.listen(port, function() {
    log.info("Server started on port " + port);
});


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
                // Promise callback
                sent();
                if(err) {
                    return next(err, recipient);
                }
                next(null, infos);
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
    if(infos.accepted.length) {
        log.info('Message sent to ' + status.accepted[0]);
    }
    if(infos.rejected.length) {
        log.info('Message failed to send to ' + status.rejected[0]);
    }
}