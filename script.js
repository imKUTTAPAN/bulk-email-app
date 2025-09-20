// Get a reference to the main form and all relevant elements
const emailForm = document.getElementById('email-form');
const csvUpload = document.getElementById('csv-upload');
const recipientsList = document.getElementById('recipients-list');
const manualEmail = document.getElementById('manual-email');
const manualFirstName = document.getElementById('manual-first-name');
const manualLastName = document.getElementById('manual-last-name');
const addRecipientBtn = document.getElementById('add-recipient-btn');
const subjectLine = document.getElementById('subject-line');
const messageInput = document.getElementById('message-input');
const statusDisplay = document.getElementById('status-display');

// This array will hold all of our recipient objects
let recipients = [];

// Listen for a change event on the CSV file input
csvUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    // Clear previous recipients when a new file is uploaded
    recipients = []; 
    
    // Check if a file was selected
    if (file) {
        // Use Papa Parse to read and parse the CSV file
        Papa.parse(file, {
            header: true, // Treat the first row as column headers
            skipEmptyLines: true,
            complete: function(results) {
                // The parsed data is in results.data
                const parsedData = results.data;
                
                // Process the data to validate and remove duplicates
                const newRecipients = processRecipients(parsedData);
                
                // Add the new recipients to our main array
                recipients = [...newRecipients];

                // Remove duplicates and re-render the list
                recipients = removeDuplicates(recipients);
                renderRecipients();
            }
        });
    }
});

// Listen for a click event on the "Add" button for manual entry
addRecipientBtn.addEventListener('click', function(event) {
    // Prevent the button from submitting a form
    event.preventDefault();

    const email = manualEmail.value.trim();
    const firstName = manualFirstName.value.trim();
    const lastName = manualLastName.value.trim();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate the email format and check if it's empty
    if (email && emailRegex.test(email)) {
        const newRecipient = {
            email: email,
            first_name: firstName,
            last_name: lastName
        };

        // Add the new recipient to our main array
        recipients = [...recipients, newRecipient];

        // Re-run the de-duplication and rendering
        recipients = removeDuplicates(recipients);
        renderRecipients();

        // Clear the input fields for the next entry
        manualEmail.value = '';
        manualFirstName.value = '';
        manualLastName.value = '';
    } else {
        alert('Please enter a valid email address.');
    }
});

// Add a submit event listener to the form
emailForm.addEventListener('submit', async function(event) {
    // Prevent the default form submission
    event.preventDefault();

    // Basic validation
    if (recipients.length === 0) {
        alert('Please add at least one recipient.');
        return;
    }
    if (!subjectLine.value.trim() || !messageInput.value.trim()) {
        alert('Please fill out the subject and message fields.');
        return;
    }

    // Prepare the data to be sent to the backend
    const campaignData = {
        subject: subjectLine.value,
        message: messageInput.value,
        recipients: recipients,
    };

    // Show a sending status to the user
    statusDisplay.innerHTML = '<p class="status">Campaign status: <span class="sending">Sending...</span></p>';

    try {
        // Send the data to our Vercel serverless function
        const response = await fetch('/api/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(campaignData),
        });

        const result = await response.json();

        // Check for a successful response
        if (response.ok) {
            // Display the campaign metrics
            displayCampaignMetrics(result.metrics);
        } else {
            // Handle errors from the server
            statusDisplay.innerHTML = `<p class="status error">Error: ${result.message}</p>`;
        }
    } catch (error) {
        // Handle network errors
        console.error('Network error:', error);
        statusDisplay.innerHTML = '<p class="status error">A network error occurred. Please try again.</p>';
    }
});

/**
 * Validates and sanitizes recipient data from the CSV.
 * @param {Array<Object>} data - The parsed data from Papa Parse.
 * @returns {Array<Object>} The cleaned array of recipients.
 */
function processRecipients(data) {
    const validRecipients = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    data.forEach(row => {
        // Ensure email column exists and has a value before processing
        if (row.email) {
            const email = row.email.trim();
            const firstName = row.first_name ? row.first_name.trim() : '';
            const lastName = row.last_name ? row.last_name.trim() : '';

            // Validate the email format
            if (email && emailRegex.test(email)) {
                validRecipients.push({
                    email: email,
                    first_name: firstName,
                    last_name: lastName
                });
            } else {
                // You could add logic here to display an error message for invalid emails
                console.error(`Invalid email format found: ${email}`);
            }
        }
    });

    return validRecipients;
}

/**
 * Removes duplicate recipients based on their email address.
 * @param {Array<Object>} list - The array of recipient objects.
 * @returns {Array<Object>} The array with duplicates removed.
 */
function removeDuplicates(list) {
    const seenEmails = new Set();
    return list.filter(item => {
        // Use a consistent key for checking duplicates
        const emailKey = item.email.toLowerCase(); 
        const isDuplicate = seenEmails.has(emailKey);
        seenEmails.add(emailKey);
        return !isDuplicate;
    });
}

/**
 * Renders the list of recipients on the page.
 */
function renderRecipients() {
    recipientsList.innerHTML = ''; // Clear the current list
    
    if (recipients.length === 0) {
        recipientsList.innerHTML = '<p>No recipients added yet.</p>';
        return;
    }

    recipients.forEach((recipient, index) => {
        const recipientItem = document.createElement('div');
        recipientItem.classList.add('recipient-item');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${recipient.first_name} ${recipient.last_name} <${recipient.email}>`;
        
        // Create a remove button for each recipient
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeRecipient(index);
        
        recipientItem.appendChild(nameSpan);
        recipientItem.appendChild(removeButton);
        recipientsList.appendChild(recipientItem);
    });
}

/**
 * Removes a recipient from the list by their index.
 * @param {number} index - The index of the recipient to remove.
 */
function removeRecipient(index) {
    recipients.splice(index, 1);
    renderRecipients(); // Re-render the list to reflect the change
}

/**
 * Displays the campaign metrics on the page.
 * @param {Object} metrics - The metrics object from the backend response.
 */
function displayCampaignMetrics(metrics) {
    statusDisplay.innerHTML = `
        <div class="metrics">
            <h3>Campaign Metrics</h3>
            <p class="status completed">Status: ${metrics.status}</p>
            <p><strong>Total Recipients:</strong> ${recipients.length}</p>
            <p><strong>Sent:</strong> ${metrics.sent_count}</p>
            <p><strong>Failed:</strong> ${metrics.failed_count}</p>
            <p><strong>Simulated Opens:</strong> ${metrics.opens_count}</p>
        </div>
    `;
}

// Initial render to show "No recipients added yet."
renderRecipients();