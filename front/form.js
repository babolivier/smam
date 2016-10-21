var items = {
    name: 'form_name',
    addr: 'form_addr',
    subj: 'form_subj',
    text: 'form_text',
};

var server  = getServer();
var xhrSend = new XMLHttpRequest();


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
            if(url.match(/:[0-9]+\/form\.js$/)) {
                // Port has been found
                return url.match(/^(http:\/\/[^\/]+)/)[1];
            }
        }
    }    
}


// Creates a form
// id: HTML identifier of the document's block to create the form into
// return: nothing
function generateForm(id) {
    var el = document.getElementById(id);
    
    // Set the form's behaviour
    el.setAttribute('onsubmit', 'sendForm(); return false;');
    
    // Add an empty paragraph for status
    var status = document.createElement('p');
    status.setAttribute('id', 'form_status');
    el.appendChild(status);
    
    var input = {
        name: getField(items.name, 'Your name', false, 'input'), // TODO: configurable prefix
        addr: getField(items.addr, 'Your e-mail address', true, 'input'),
        subj: getField(items.subj, 'Your message\'s subject', false, 'input'),
        text: getField(items.text, 'Your message', false, 'textarea')
    };
    
    // Adding nodes to document
    
    el.appendChild(input.name);
    el.appendChild(input.addr);
    el.appendChild(input.subj);
    el.appendChild(input.text);
    
    // Adding submit button
    
    el.appendChild(getSubmitButton('form_subm', 'Send the mail'));
    
    // Setting the XHR callback
    
    xhrSend.onreadystatechange = function() {
        if(xhrSend.readyState == XMLHttpRequest.DONE) {
            let status = document.getElementById('form_status');
            status.setAttribute('class', '');
            if(xhrSend.status === 200) {
                cleanForm();
                status.setAttribute('class', 'success');
                status.innerHTML = 'Your message has been sent.';
            } else {
                status.setAttribute('class', 'failure');
                status.innerHTML = 'An error happened while sending your message, please retry later.';
            }
        }
    };
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
    button.setAttribute('id', id);
    
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
    status.innerHTML = 'Sending the e-mail';
    
    xhrSend.open('POST', server + '/send');
    xhrSend.setRequestHeader('Content-Type', 'application/json');
    xhrSend.send(JSON.stringify(getFormData()));
}


// Fetch form inputs from HTML elements
// return: an object containing all the user's input
function getFormData() {
    return {
        name: document.getElementById(items.name + '_input').value,
        addr: document.getElementById(items.addr + '_input').value,
        subj: document.getElementById(items.subj + '_input').value,
        text: document.getElementById(items.text + '_textarea').value
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