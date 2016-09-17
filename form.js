function generateForm(id) {
    var el = document.getElementById(id);
    
    var input = {
        name: getField('form_name', 'Your name', false), // TODO: configurable prefix
        addr: getField('form_addr', 'Your e-mail address', true),
        subj: getField('form_subj', 'Your mail\'s subject', false),
        text: {}
    };
    
    // Adding nodes to document
    
    el.appendChild(input.name);
    el.appendChild(input.addr);
    el.appendChild(input.subj);
}


// Returns a form field
// id: field HTML identifier
// placeholder: placeholder text
// email: boolean: is it an email field?
// return: a div node containing a label and an input text field
function getField(id, placeholder, email) {
    var field = document.createElement('div');
    
    field.setAttribute('id', id); // TODO: configurable prefix
    field.appendChild(getLabel(id, placeholder));
    field.appendChild(getInputField(id, placeholder, email));
    
    return field;
}


// Returns a label
// id: field HTML identifier
// content: label's inner content
// return: a label node the field's description
function getLabel(id, content) {
    var label = document.createElement('label');
    
    label.setAttribute('for', id + '_input');
    label.innerHTML = content;
    
    return label;
}


// Returns an input text field
// id: field HTML identifier
// placeholder: placeholder text, field description
// email: boolean: is it an email field?
// return: an input text or email field (depending on "email"'s value') with an
//         HTML id and a placeholder text
function getInputField(id, placeholder, email) {
    var input = document.createElement('input');
    
    if(email) {
        input.setAttribute('type', 'mail');
    } else {
        input.setAttribute('type', 'text');
    }
    
    input.setAttribute('required', 'required');
    input.setAttribute('placeholder', placeholder);
    input.setAttribute('id', id + '_input');
    
    return input;
}