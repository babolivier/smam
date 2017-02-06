// Consts for readability
const REQUIRED      = true;
const NOT_REQUIRED  = false;


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
var lang    		= [];
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
    
    DOMFields = {
        name: getField({
            name: items.name,
            label: lang.form_name_label,
            type: 'text'
        }, REQUIRED),
        addr: getField({
            name: items.addr,
            label: lang.form_addr_label,
            type: 'email'
        }, REQUIRED),
        subj: getField({
            name: items.subj,
            label: lang.form_subj_label,
            type: 'text'
        }, REQUIRED),
        text: getField({
            name: items.text,
            label: lang.form_mesg_label,
            type: 'textarea'
        }, REQUIRED)
    };
    
    // Adding custom fields
    
    for(let fieldName in customFields) {
        let field = customFields[fieldName];
        DOMFields[fieldName] = getField(field, NOT_REQUIRED);
    }
    
    // Adding nodes to document

    for(let field in DOMFields) {
        el.appendChild(DOMFields[field]);
    }

    // Adding submit button
    
    el.appendChild(getSubmitButton('form_subm', lang.form_subm_label));
    
    // Retrieve the token from the server
    
    getToken();
}


function getField(fieldInfos, required) {
    var block = document.createElement('div');
    
    block.setAttribute('id', fieldInfos.name);
    
    let field = {};
    
    switch(fieldInfos.type) {
        case 'text':        field = getTextField(fieldInfos, required);
                            break;
        case 'textarea':    field = getTextarea(fieldInfos, required);
                            break;
        case 'email':       field = getEmailField(fieldInfos, required);
                            break;
        case 'select':      field = getSelectField(fieldInfos, required);
                            break;
    }

    if(labels) {
        block.appendChild(getLabel(fieldInfos.label, field.id));
    }

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


function getSelectField(fieldInfos, required) {
    let field = document.createElement('select');

    if(required) {
        field.setAttribute('required', 'required');
    }
    field.setAttribute('id', prefix + '_' + fieldInfos.name + '_select');

    let index = 0;
    
    // Add all options to select
    for(let choice of fieldInfos.options) {
        let option = document.createElement('option');
        option.setAttribute('value', index);
        option.innerHTML = choice;
        field.appendChild(option);
        index++;
    }

    return field
}


function getTextField(fieldInfos, required) {
    return getBaseInputField(fieldInfos, required, 'text');
}


function getEmailField(fieldInfos, required) {
    return getBaseInputField(fieldInfos, required, 'email');
}


function getBaseInputField(fieldInfos, required, type) {
    let field = getBaseField(fieldInfos, required, 'input')
    field.setAttribute('type', type);
    return field;
}


function getTextarea(fieldInfos, required) {
    return getBaseField(fieldInfos, required, 'textarea');
}


function getBaseField(fieldInfos, required, tag) {
    let field = document.createElement(tag);
    
    if(required) {
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

    // Custom fields
    // Select the field
    let index = 0;

    if(labels) {
        index = 1;
    }
    
    for(let field in DOMFields) {
        let el = DOMFields[field].children[index];
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
    document.getElementById(prefix + '_' + items.name + '_input').value = '';
    document.getElementById(prefix + '_' + items.addr + '_input').value = '';
    document.getElementById(prefix + '_' + items.subj + '_input').value = '';
    document.getElementById(prefix + '_' + items.text + '_textarea').value = '';
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