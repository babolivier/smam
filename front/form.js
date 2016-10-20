function generateForm(id) {
    var el = document.getElementById(id);
    
    var input = {
        name: getField('form_name', 'Your name', false, 'input'), // TODO: configurable prefix
        addr: getField('form_addr', 'Your e-mail address', true, 'input'),
        subj: getField('form_subj', 'Your message\'s subject', false, 'input'),
        text: getField('form_text', 'Your message', false, 'textarea')
    };
    
    // Adding nodes to document
    
    el.appendChild(input.name);
    el.appendChild(input.addr);
    el.appendChild(input.subj);
    el.appendChild(input.text);
    
    // Adding submit button
    
    el.appendChild(getSubmitButton('form_subm', 'Send the mail'));
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
            input.setAttribute('type', 'mail');
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
    // Disable button's default action
    button.setAttribute('onSubmit', 'return false;');
    
    button.innerHTML = text;
    
    submit.appendChild(button);
    
    return submit;
}