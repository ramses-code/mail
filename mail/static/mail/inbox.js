document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
    document.querySelector('#compose-form').addEventListener('submit', sendEmail);
    
    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email').style.display = 'none';
    
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    
    // Get all emails and create a div for each
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        emails.forEach(email => {
            const emailDiv = document.createElement('div');
            emailDiv.innerHTML = `<span><strong>${email.sender}</strong></span> <span class='ml-2'>${email.subject}</span> <span class='text-muted float-right'>${email.timestamp}</span>`;
            email.read ? emailDiv.setAttribute('class', 'list-group-item bg-light') : emailDiv.setAttribute('class', 'list-group-item'); 
            emailDiv.addEventListener('click', () => {
                viewEmail(email.id, mailbox);
            })
            document.querySelector('#emails-view').append(emailDiv);
        });
    }).catch(err => err);
}

function sendEmail(e) {
    e.preventDefault();

    // Get input values
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;
    // Send email
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        load_mailbox('sent');
    }).catch(err => err);
}

function viewEmail(id, mailbox) {
    // Show email and hide email-view
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email').style.display = 'block';
    
    // Get email by its id
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
        // Create content for an email view when clicked
        document.querySelector('#email').innerHTML = `
        <p><strong>From: </strong>${email.sender}</p>
        <p><strong>To: </strong>${email.recipients}</p>
        <p><strong>Subject: </strong>${email.subject}</p>
        <p><strong>Timestamp: </strong>${email.timestamp}</p>
        <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
        <button class="btn btn-sm btn-outline-primary" id="archive"></button>
        <hr>
        <p>${email.body}</p>
        `;
        let replay = document.querySelector('#reply');
        let archive = document.querySelector('#archive');

        email.archived ? archive.innerHTML = 'Unarchive' : archive.innerHTML = 'Archive';

        // Don't show replay and archive buttons in sent mailbox
        if (mailbox === 'sent') {
            replay.style.display = 'none';
            archive.style.display = 'none';
        }

        archive.addEventListener('click', () => {
            email.archived ? handleUnarchiveEmail(email.id) : handleArchivedEmail(email.id);
        });

        replay.addEventListener('click', () => {
            replyEmail(email);
        });
        
        // If false, set email.read == true
        if (email.read === false) handleReadEmail(email.id);

    }).catch(err => err);
}

function handleReadEmail(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });
}

function handleArchivedEmail(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
    }).then(() => load_mailbox('inbox'))
    
}
function handleUnarchiveEmail(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
    }).then(() => load_mailbox('inbox'))
    
}

function replyEmail(email) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote: \n${email.body}`;
}