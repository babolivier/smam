# SMAM (Send Me A Mail)

Always wanted to implement a contact form in your website and/or portfolio, but don't want to busy yourself with something too complex (mail sending in PHP, for example, is a complete mess)? Here's a miracle solution for ya! Just run the nodemailer-based app, include a JavaScript file in your HTML page, and you're all set :wink:

## Install and run

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

Same goes with the host. Without further instructions, the server will listen on `0.0.0.0`, which means it will accept every connection, whatever the source. You can override this by using the `HOST` environment variable:

```bash
HOST=127.0.0.1 npm start
```

So, if we want our server to only listen to requests from its host, on the 8080 port, we'll start the server like this:

```bash
HOST=127.0.0.1 PORT=8080 npm start
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
    ],
    "formOrigin": "https://example.tld",
    "language": "en"
}
```

The `mailserver` section is the set of parameters which will be passed to nodemailer's transporter initialisation, describing the output mail server and following the same structure as the `option` object in [nodemailer's SMTP configuration section](https://github.com/nodemailer/nodemailer#set-up-smtp). Please head there to have the full list of parameters.

The `recipients` section is an array containing the e-mail addresses any message sent via the form will be sent to. Just write down the form's recipient(s)'s addresse(s).

The `formOrigin` part is a string containing the origin of the page you'll include the contact form into. This allows SMAM to work with the [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) security most browser use. For more info on how to fill this field, and what is an origin, please give a look at [the MDN's definition](https://developer.mozilla.org/en-US/docs/Glossary/origin).

Finally, the `language` string tells SMAM in which language you want your form served. Possible values are all the files in `locales/`'s names (without the `.json`). To create your own translation, please read the section below.

## Templating

Each e-mail sent by the form follows a template described in `template.pug` (it's [Pug](pugjs.org/)). If you want to change the way the e-mails you receive are displayed in your mailbox, just edit it! You don't even need to restart the server aftewards :smile:

## Personnalising

As you might have already seen, the contact form is generated without any form of style except your browser's default one. But that doesn't meen that you have to add an ugly form to your site to receive contact e-mails, as every element has a specific id (beginning with the `form_` prefix), allowing you to use your own style on your contact form.

The generated form will look like this:

```html
<p id="form_status"></p>
<div id="form_name">
    <label for="form_name_input">Your name</label>
    <input required="required" placeholder="Your name" id="form_name_input" type="text">
</div>
<div id="form_addr">
    <label for="form_addr_input">Your e-mail address</label>
    <input required="required" placeholder="Your e-mail address" id="form_addr_input" type="email">
</div>
<div id="form_subj">
    <label for="form_subj_input">Your message's subject</label>
    <input required="required" placeholder="Your message's subject" id="form_subj_input" type="text">
</div>
<div id="form_text">
    <label for="form_text_textarea">Your message</label>
    <textarea required="required" placeholder="Your message" id="form_text_textarea"></textarea>
</div>
<div id="form_subm">
    <button type="submit" id="form_subm">Send the mail</button>
</div>
```

Now it's all yours to make good use of all these identifiers and have a magnificient contact form :wink:

I think that the code in itself is clear enough, if not please tell me so I can detail everything here!

## Translating

Right now, SMAM is only available in French and English. If you want to implement your own language, you can do so by creating a new file in the `locales/` directory, named following your language's identifier with the `.json` extension (`en.json` for exemple). You can then have a look at the strings in `en.json`, copy them and translate them in your language. To use this translation, just set the `language` field (in your settings file) to your language's identifier.

As I don't speak all languages, [pull requests](#contribute) with new languages are more than welcome! You'd be sharing your knowledge with the whole community and help more people using SMAM around the world :smile:

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
