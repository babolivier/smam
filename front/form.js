/***************************************************************
*                                                              *
*                     SMAM: Send Me A Mail                     *
*                                                              *
* Made with ♥ by Brendan Abolivier <foss@brendanabolivier.com> *
* Source code available under GPLv3 license here:              *
*                       https://github.com/babolivier/smam/    *
*                                                              *
***************************************************************/

var prefix = 'form'

var items = {
	name: 'name',
	addr: 'addr',
	subj: 'subj',
	text: 'text',
};

var DOMFields = {};

var server  		= getServer();
var token   		= "";
var labels  		= true;
var lang			= [];
var customFields 	= {};

var xhr = {
	customFields: new XMLHttpRequest(),
	lang: new XMLHttpRequest(),
	token: new XMLHttpRequest(),
	send: new XMLHttpRequest()
}

// XHR callbacks

xhr.customFields.onreadystatechange = function() {
	if(xhr.customFields.readyState == XMLHttpRequest.DONE) {
		customFields = JSON.parse(xhr.customFields.responseText);
		for(let field in customFields) {
			customFields[field].name = field;
		}
	}
};

xhr.token.onreadystatechange = function() {
	if(xhr.token.readyState == XMLHttpRequest.DONE) {
		token = xhr.token.responseText;
	}
};

xhr.lang.onreadystatechange = function() {
	if(xhr.lang.readyState == XMLHttpRequest.DONE) {
		let response = JSON.parse(xhr.lang.responseText);
		lang = response.translations;
		labels = response.labels;
	}
};

xhr.send.onreadystatechange = function() {
	if(xhr.send.readyState == XMLHttpRequest.DONE) {
		let status = document.getElementById('form_status');
		status.setAttribute('class', '');
		if(xhr.send.status === 200) {
			cleanForm();
			status.setAttribute('class', 'success');
			status.innerHTML = lang.send_status_success;
		} else {
			status.setAttribute('class', 'failure');
			status.innerHTML = lang.send_status_failure;
		}
	}
};


// Returns the server's base URI based on the user's script tag
// return: the SMAM server's base URI
function getServer() {
	var scripts = document.getElementsByTagName('script');
	// Parsing all the <script> tags to find the URL to our file
	for(var i = 0; i < scripts.length; i++) {
		let script = scripts[i];
		if(script.src) {
			let url = script.src;
			// This should be our script
			if(url.match(/form\.js$/)) {
				// Port has been found
				return url.match(/^(https?:\/\/[^\/]+)/)[1];
			}
		}
	}
}


// Creates a form
// id: HTML identifier of the document's block to create the form into
// return: nothing
function generateForm(id) {
	// Get translated strings
	getLangSync();
	// Get custom fields if defined in the configuration
	getCustomFieldsSync();

	var el = document.getElementById(id);

	// Set the form's behaviour
	el.setAttribute('onsubmit', 'sendForm(); return false;');

	// Add an empty paragraph for status
	var status = document.createElement('p');
	status.setAttribute('id', 'form_status');
	el.appendChild(status);

	// Default fields
	DOMFields = {
		name: getField({
			name: items.name,
			label: lang.form_name_label,
			type: 'text',
			required: true
		}),
		addr: getField({
			name: items.addr,
			label: lang.form_addr_label,
			type: 'email',
			required: true
		}),
		subj: getField({
			name: items.subj,
			label: lang.form_subj_label,
			type: 'text',
			required: true
		})
	};

	// Adding custom fields
	for(let fieldName in customFields) {
		let field = customFields[fieldName];
		DOMFields[fieldName] = getField(field);
	}

	// Add the message's textarea
	DOMFields["text"] = getField({
		name: items.text,
		label: lang.form_mesg_label,
		type: 'textarea',
		required: true
	});

	// Adding all nodes to document
	for(let field in DOMFields) {
		el.appendChild(DOMFields[field]);
	}


	// Adding submit button
	el.appendChild(getSubmitButton('form_subm', lang.form_subm_label));

	// Retrieve the token from the server
	getToken();
}


// Get the HTML element for a given field
// fieldInfos: object describing the field
// required: boolean on whether the field is required or optional
// return: a block containing the field and a label describing it (if enabled)
function getField(fieldInfos) {
	var block = document.createElement('div');
	block.setAttribute('id', fieldInfos.name);

	// Declare the variable first
	let field = {};

	// Easily add new supported input types
	switch(fieldInfos.type) {
		case 'textarea':	field = getTextarea(fieldInfos);
							break;
		case 'select':		field = getSelectField(fieldInfos);
							break;
		default:			field = getInputField(fieldInfos);
							break;
	}

	// We need the input field's ID to bind it to the label, so we generate the
	// field first
	if(labels) {
		block.appendChild(getLabel(fieldInfos.label, field.id));
	}

	// Assemble the block and return it
	block.appendChild(field);
	return block;
}


// Returns a label
// content: label's inner content
// id: field HTML identifier
// return: a label node the field's description
function getLabel(content, id) {
	var label = document.createElement('label');

	label.setAttribute('for', id);
	label.innerHTML = content;

	return label;
}


// Returns a <select> HTML element
// fieldInfos: object describing the field
// required: boolean on whether the field is required or optional
// return: a <select> element corresponding to the info passed as input
function getSelectField(fieldInfos) {
	let field = document.createElement('select');

	// Set attributes when necessary
	if(fieldInfos.required) {
		field.setAttribute('required', 'required');
	}
	field.setAttribute('id', prefix + '_' + fieldInfos.name + '_select');

	let index = 0;

	// Add header option, useful if the field is required
	let header = document.createElement('option');
	// The value must be an empty string so the browser can block the submit
	// event if the field is required
	header.setAttribute('value', '');
	// If the labels are disabled, set the header option's inner text as the
	// field's label
	if(labels) {
		header.innerHTML = lang.form_select_header_option;
	} else {
		header.innerHTML = fieldInfos.label;
	}
	field.appendChild(header);

	// Add all options to select
	for(let choice of fieldInfos.options) {
		let option = document.createElement('option');
		// Options' values are incremental numeric indexes
		option.setAttribute('value', index);
		// Set the value defined by the user
		option.innerHTML = choice;
		field.appendChild(option);
		// Increment the index
		index++;
	}

	return field
}


// Returns a <input> HTML element with desired type
// fieldInfos: object describing the field
// required: boolean on whether the field is required or optional
// type: type of the input field (text, email, date...)
// return: a <input> HTML element corresponding to the info passed as input
function getInputField(fieldInfos, required) {
	let field = getBaseField(fieldInfos, required, 'input')
	field.setAttribute('type', fieldInfos.type);
	return field;
}


// Returns a <textarea> HTML element
// fieldInfos: object describing the field
// required: boolean on whether the field is required or optional
// return: a <textarea> element corresponding to the info passed as input
function getTextarea(fieldInfos, required) {
	return getBaseField(fieldInfos, required, 'textarea');
}


// Returns a base HTML element with generic info to be processed by functions at
// higher level
// fieldInfos: object describing the field
// required: boolean on whether the field is required or optional
// tag: the HTML tag the field element must have
// return: a HTML element of the given tag with basic info given as input
function getBaseField(fieldInfos, required, tag) {
	let field = document.createElement(tag);

	if(fieldInfos.required) {
		field.setAttribute('required', 'required');
	}
	field.setAttribute('placeholder', fieldInfos.label);
	field.setAttribute('id', prefix + '_' + fieldInfos.name + '_' + tag);

	return field;
}


// Returns a submit button
// id: button HTML identifier
// text: button text
// return: a div node containing the button
function getSubmitButton(id, text) {
	var submit = document.createElement('div');

	submit.setAttribute('id', id);

	var button = document.createElement('button');

	button.setAttribute('type', 'submit');
	button.setAttribute('id', id + '_btn');

	button.innerHTML = text;

	submit.appendChild(button);

	return submit;
}


// Send form data through the XHR object
// return: nothing
function sendForm() {
	// Clear status
	let status = document.getElementById('form_status');
	status.setAttribute('class', 'sending');
	status.innerHTML = lang.send_status_progress;

	xhr.send.open('POST', server + '/send');
	xhr.send.setRequestHeader('Content-Type', 'application/json');
	xhr.send.send(JSON.stringify(getFormData()));

	// Get a new token
	getToken();
}


// Fetch form inputs from HTML elements
// return: an object containing all the user's input
function getFormData() {
	let data = {};
	data.token = token;
	data.custom = {};

	// Select the field
	let index = 0;
	if(labels) {
		index = 1;
	}

	// Iterate over all the fields
	for(let field in DOMFields) {
		let el = DOMFields[field].children[index];
		// Do we need to push this field into default or custom fields?
		if(field in customFields) {
			data.custom[field] = el.value;
		} else {
			data[field] = el.value;
		}
	}

	return data;
}


// Empties the form fields
// return: nothing
function cleanForm() {
	// Select the field
	let index = 0;
	if(labels) {
		index = 1;
	}

	// Iterate over all the fields
	for(let field in DOMFields) {
		let el = DOMFields[field].children[index];
		// If it's a <select> element, select the first element so it looks
		// like a reset
		if(!el.tagName.toLowerCase().localeCompare('select')) {
			el.children[0].selected = true;
		} else {
			el.value = '';
		}
	}
}


// Asks the server for a token
// return: nothing
function getToken() {
	xhr.token.open('GET', server + '/register');
	xhr.token.send();
}


// Asks the server for translated strings to display
// return: notghing
function getLangSync() {
	xhr.lang.open('GET', server + '/lang', false);
	xhr.lang.send();
}


// Asks the server for the custom fields if there's one or more set in the
// configuration file
// return: nothing
function getCustomFieldsSync() {
	xhr.customFields.open('GET', server + '/fields', false);
	xhr.customFields.send();
}