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
	"language": "en",
	"labels": true,
	"customFields": {
		"deadline": {
			"label": "Development deadline",
			"type": "select",
			"options": [
				"A week",
				"A month",
				"More than a month"
			],
			"required": true
		},
		"domain": {
			"label": "Website domain",
			"type": "text",
			"required": false
		},
		"budget_max": {
			"label": "Maximum budget (€)",
			"type": "number",
			"required": true
		}
	}
}
```

The `mailserver` section is the set of parameters which will be passed to nodemailer's transporter initialisation, describing the output mail server and following the same structure as the `option` object in [nodemailer's SMTP configuration section](https://github.com/nodemailer/nodemailer#set-up-smtp). Please head there to have the full list of parameters.

The `recipients` section is an array containing the e-mail addresses any message sent via the form will be sent to. Just write down the form's recipient(s)'s addresse(s).

The `formOrigin` part is a string containing the origin of the page you'll include the contact form into. This allows SMAM to work with the [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) security most browser use. For more info on how to fill this field, and what is an origin, please give a look at [the MDN's definition](https://developer.mozilla.org/en-US/docs/Glossary/origin).

The `language` string tells SMAM in which language you want your form served. Possible values are all the files in `locales/`'s names (without the `.json`). To create your own translation, please read the section below.

Finally, the `labels` setting is a boolean to set whether or not labels will be displayed in the `<form></form>` block. If set to `false`, the form will still display the front-end strings ("Your name", "Your e-mail address"...), but only as placeholders in the text fields. If set to true, the said strings will appear as text fields' placeholders but also as labels outside of the fields. If not set, defaults to `true`.

The `customFields` section is optional and describes custom form fields, which are described below.

## Custom fields

SMAM allows you to add custom fields to your form (in addition to the default ones, which are the sender's name, the sender's e-mail address, the message's subject and the message's content). These fields will be added in your form just above the content's field, in a tag defined by the settings file (one of &lt;input&gt;, &lt;select&gt; and &lt;textarea&gt;). We'll see below how to set the field's type.

A custom field is defined in the `customFields` section of your settings file, as described below:

```json
"field_name": {
	"label": "My field",
	"type": "select",
	"required": true,
	"options": [
		"Option 1",
		"Option 2",
		"Option 3"
	]
}
```

* **field_name** (required) is an identifier for your field, it will only be used internally by the software.
* **label** (required) is both the label/placeholder displayed with your field in the form and the label displayed next to the user-input value in the final e-mail.
* **type** (required) is the type of your field. If you set it to "select", the form field will use a &lt;select&gt; tag (this will require the `options` parameters being set). "textarea" will set the field to use the &lt;textarea&gt; tag. If any other value is set here, it will be placed in the `type` attribute of an &lt;input&gt; tag. Head over [here](https://developer.mozilla.org/fr/docs/Web/HTML/Element/Input#attr-type) for a full list of accepted input types. Please not that the `checkbox` and `radio` types aren't currently supported (but will be in the future). There's no support planned for the `submit` and `reset` types.
* **required** (optional) is a boolean. Set it to true and the field will be set as required in your form. A modern browser should prevent an user to send the form if a required field isn't filled. On top of that, SMAM's server will check the field marked as required to make sure they've been filled.
* **options** (optional) is an array of possible values. This is currently useful only if your field is of the "select" type.

## Templating

Each e-mail sent by the form follows a template described in `template.example.pug` (it's [Pug](pugjs.org/)). If you want to change the way the e-mails you receive are displayed in your mailbox, just edit it! You don't even need to restart the server aftewards :smile:

The template also features custom fields, iterating over the `custom` object, containing the field's label and user-input value:

```json
"field_name": {
	"label": "My field",
	"value": "Hello"
}
```

The template needs to be named `template.pug`. If no template could be found under this name, SMAM will use a default one, which features both default and custom fields, and should be sufficient for non-advanced usage.

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
	<button type="submit" id="form_subm_btn">Send the mail</button>
</div>
```

Custom fields will be formatted the same way (and with identifiers following the same guidelines) as default fields. For example, a custom field described as

```json
"budget": {
	"label": "Maximum budget allowed",
	"type": "number",
	"required": true
}
```
in the settings file will result in
```html
<div id="form_budget">
	<label for="form_budget_input">Maximum budget allowed</label>
	<input required="required" placeholder="Maximum budget allowed" id="form_budget_input" type="number">
</div>
```

Please note that the field's identifier ends with the field's tag name and not its type. For example, our `budget` field above will see its identifier become `form_budget_select` if it has the "select" type, `form_budget_textarea` if it has the "textarea" type, or `form_budget_input` for any other "type" value.

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
