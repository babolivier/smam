var bodyParser  = require('body-parser');
var express     = require('express');
var app = express();

// Logging
var printit = require('printit');
var log = printit({
    prefix: 'SMAM',
    date: true
});


// Serve static (JS + HTML) files
app.use(express.static('front'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.post('/send', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send();
    console.log(req.body);
});


app.listen(1970, function() {
    log.info("Server started");
});
