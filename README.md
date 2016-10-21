# SMAM (Send Me A Mail)

Always wanted to implement a contact form in your website and/or portfolio, but don't want to busy yourself with something too complex (mail sending in PHP, for example, is a complete mess)? Here's a miracle solution for ya! Just run the nodemailer-based app, include a JavaScript file in your HTML page, and you're all set :wink:

## Install

Just clone this repository, edit the `settings.json` file (described below) and run the server:

```
git clone https://github.com/babolivier/smam
cd smam
npm install
npm start
```

The default port will be set to `1970`, but you can set the one you want by using an environment variable:

```bash
PORT=8080 npm start
```

Obviously, you'll need Node.js and NPM (or any Node.js package manager) to run the app. As we're launching a webserver (which will serve the necessary files and process the mail sending requests), this app will run continuously. One good practice would be to run it as a daemon (in a systemd service, for example).

## Usage

First, include the script in your HTML page's header:

```html
<head>
    ...
    <script src="http://www.example.tld:1970/form.js" charset="utf-8"></script>
    ...
</head>
```

Then, add an empty `<form>` tag to your page's body. It **must** have an ID. Now, pass this ID to the `generateForm()` function in a `<script>` block, as such:

```html
<body>
    ...
    <form id="smam"></form>
    <script type="text/javascript">
        generateForm('smam');
    </script>
    ...
</body>
```

## Configuration

First, you must rename the `settings.example.conf` into `settings.conf`, and edit it. You'll find yourself in front of a file with this structure:

```json
{
    "mailserver": {
        "pool": true,
        "host": "mail.example.tld",
        "port": 465,
        "secure": true,
        "auth": {
            "user": "noreply@noreply.tld",
            "pass": "hackme"
        }
    },
    "recipients": [
        "you@example.tld",
        "someone.else@example.com"
    ]
}
```

The `mailserver` section is the set of parameters which will be passed to nodemailer's transporter initialisation, describing the output mail server and following the same structure as the `option` object in [nodemailer's SMTP configuration section](https://github.com/nodemailer/nodemailer#set-up-smtp). Please head there to have the full list of parameters.

The `recipients` server is an array containing the e-mail addresses any message sent via the form will be sent to. Just write down the form's recipient(s)'s addresse(s).

## Contribute

If you like this project and want to help, there's many way to do it.

- Suggest new features in an [issue](https://github.com/babolivier/smam/issues)
- Report every bug or inconvenience you encountered during this software in the [issues](https://github.com/babolivier/smam/issues)
- Pick up an [issue](https://github.com/babolivier/smam/issues) and fix it by submitting a [pull request](https://github.com/babolivier/smam/pulls)
- Implement a new database driver
- Start implementing a new feature you'd like to use in the software*

\* Before you start implementing anything, please make sure to create an [issue](https://github.com/babolivier/smam/issues) about it if one hasn't been created yet. If I don't want to see your idea in SMAM (even if it's quite unlikely), it can be frustrating to you to have been working hard on someting for nothing.

## Get in touch

If you want to talk with me in person about SMAM, you can contact me in different ways:

- Via Twitter at [@BrenAbolivier](https://twitter.com/BrenAbolivier)
- Via IRC, I'm usually hanging out on [Freenode](https://freenode.net) as *babolivier*
- Via e-mail, at <oss@brendanabolivier.com>