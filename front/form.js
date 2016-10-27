var items = {
    name: 'form_name',
    addr: 'form_addr',
    subj: 'form_subj',
    text: 'form_text',
};

var server  = getServer();
var token = "";
var lang = {};

var xhr = {
    lang: new XMLHttpRequest(),
    token: new XMLHttpRequest(),
    send: new XMLHttpRequest()
}

// XHR callbacks

xhr.token.onreadystatechange = function() {
    if(xhr.token.readyState == XMLHttpRequest.DONE) {
        token = xhr.token.responseText;
    }
};

xhr.lang.onreadystatechange = function() {
    if(xhr.lang.readyState == XMLHttpRequest.DONE) {
        lang = JSON.parse(xhr.lang.responseText);
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
    
    var el = document.getElementById(id);
    
    // Set the form's behaviour
    el.setAttribute('onsubmit', 'sendForm(); return false;');
    
    // Add an empty paragraph for status
    var status = document.createElement('p');
    status.setAttribute('id', 'form_status');
    el.appendChild(status);
    
    var input = {
        name: getField(items.name, lang.form_name_label, false, 'input'),
        addr: getField(items.addr, lang.form_addr_label, true, 'input'),
        subj: getField(items.subj, lang.form_subj_label, false, 'input'),
        text: getField(items.text, lang.form_mesg_label, false, 'textarea')
    };
    
    // Adding nodes to document
    
    el.appendChild(input.name);
    el.appendChild(input.addr);
    el.appendChild(input.subj);
    el.appendChild(input.text);
    
    // Adding submit button
    
    el.appendChild(getSubmitButton('form_subm', lang.form_subm_label));
    
    // Retrieve the token from the server
    
    getToken();
}


// Returns a form field
// id: field HTML identifier
// placeholder: placeholder text
// email: boolean: is it an email field?
// type: 'input' or 'textarea'
// return: a div node containing a label and an input text field
function getField(id, placeholder, email, type) {
    var field = document.createElement('div');
    
    field.setAttribute('id', id); // TODO: configurable prefix
    field.appendChild(getLabel(id, placeholder, type));
    field.appendChild(getInputField(id, placeholder, email, type));
    
    return field;
}


// Returns a label
// id: field HTML identifier
// content: label's inner content
// type: 'input' or 'textarea'
// return: a label node the field's description
function getLabel(id, content, type) {
    var label = document.createElement('label');
    
    label.setAttribute('for', id + '_' + type);
    label.innerHTML = content;
    
    return label;
}


// Returns an input text field
// id: field HTML identifier
// placeholder: placeholder text, field description
// email: boolean: is it an email field?
// type: 'input' or 'textarea'
// return: an input text or email field (depending on "email"'s value') with an
//         HTML id and a placeholder text
function getInputField(id, placeholder, email, type) {
    var input = document.createElement(type);
    
    if(!type.localeCompare('input')) { // Set input type if input
        if(email) {
            input.setAttribute('type', 'email');
        } else {
            input.setAttribute('type', 'text');
        }
    }
    
    input.setAttribute('required', 'required');
    input.setAttribute('placeholder', placeholder);
    input.setAttribute('id', id + '_' + type);
    
    return input;
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
    return {
        name: document.getElementById(items.name + '_input').value,
        addr: document.getElementById(items.addr + '_input').value,
        subj: document.getElementById(items.subj + '_input').value,
        text: document.getElementById(items.text + '_textarea').value,
        token: token
    }
}


// Empties the form fields
// return: nothing
function cleanForm() {
    document.getElementById(items.name + '_input').value = '';
    document.getElementById(items.addr + '_input').value = '';
    document.getElementById(items.subj + '_input').value = '';
    document.getElementById(items.text + '_textarea').value = '';
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