// Message handling functions
function showNewMessageModal() {
    document.getElementById('newMessageModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Get current user ID from the body data attribute
const currentUserId = parseInt(document.body.getAttribute('data-user-id'));
console.log('Current user ID:', currentUserId);

// Handle section switching
document.addEventListener('DOMContentLoaded', function() {
    // Get all navigation links except logout
    const navLinks = document.querySelectorAll('.nav-link:not(.logout-link)');
    
    // Add click event listener to each link
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target section from the data-section attribute
            const targetSection = this.getAttribute('data-section');
            console.log('Clicked section:', targetSection);
            
            if (!targetSection) {
                console.error('No data-section attribute found on this link');
                return;
            }
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the target section
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
                console.log('Activated section:', targetSection);
                
                // If this is the messages section, load messages
                if (targetSection === 'messages') {
                    loadMessages();
                }
            } else {
                console.error('Target section not found:', targetSection);
            }
            
            // Update active state of navigation links
            navLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Handle quick action buttons
    document.querySelectorAll('.quick-actions .btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show the target section
            document.getElementById(targetSection).classList.add('active');
            
            // Update active state of navigation links
            navLinks.forEach(link => link.classList.remove('active'));
            document.querySelector(`.nav-link[data-section="${targetSection}"]`).classList.add('active');
        });
    });
});

// Handle report filters
document.addEventListener('DOMContentLoaded', function() {
    const typeFilter = document.getElementById('report-type-filter');
    const severityFilter = document.getElementById('report-severity-filter');
    const dateFilter = document.getElementById('report-date-filter');
    
    function filterReports() {
        const selectedType = typeFilter.value;
        const selectedSeverity = severityFilter.value;
        const selectedDate = dateFilter.value;
        
        const reports = document.querySelectorAll('.report-item');
        
        reports.forEach(report => {
            const type = report.getAttribute('data-type');
            const severity = report.getAttribute('data-severity');
            const date = new Date(report.getAttribute('data-date'));
            
            let showReport = true;
            
            // Apply type filter
            if (selectedType !== 'all' && type !== selectedType) {
                showReport = false;
            }
            
            // Apply severity filter
            if (selectedSeverity !== 'all' && severity !== selectedSeverity) {
                showReport = false;
            }
            
            // Apply date filter
            if (selectedDate !== 'all') {
                const today = new Date();
                const diffTime = Math.abs(today - date);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (selectedDate === 'today' && diffDays > 1) {
                    showReport = false;
                } else if (selectedDate === 'week' && diffDays > 7) {
                    showReport = false;
                } else if (selectedDate === 'month' && diffDays > 30) {
                    showReport = false;
                }
            }
            
            report.style.display = showReport ? 'block' : 'none';
        });
    }
    
    // Add event listeners to filters
    typeFilter.addEventListener('change', filterReports);
    severityFilter.addEventListener('change', filterReports);
    dateFilter.addEventListener('change', filterReports);
});

// Handle notification filters
document.addEventListener('DOMContentLoaded', function() {
    const senderFilter = document.getElementById('sender-filter');
    const dateFilter = document.getElementById('date-filter');
    
    function filterNotifications() {
        const selectedSender = senderFilter.value;
        const selectedDate = dateFilter.value;
        
        const notifications = document.querySelectorAll('.notification-item');
        
        notifications.forEach(notification => {
            const sender = notification.getAttribute('data-sender');
            const date = new Date(notification.getAttribute('data-date'));
            
            let showNotification = true;
            
            // Apply sender filter
            if (selectedSender !== 'all' && sender !== selectedSender) {
                showNotification = false;
            }
            
            // Apply date filter
            if (selectedDate !== 'all') {
                const today = new Date();
                const diffTime = Math.abs(today - date);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (selectedDate === 'today' && diffDays > 1) {
                    showNotification = false;
                } else if (selectedDate === 'week' && diffDays > 7) {
                    showNotification = false;
                } else if (selectedDate === 'month' && diffDays > 30) {
                    showNotification = false;
                }
            }
            
            notification.style.display = showNotification ? 'block' : 'none';
        });
    }
    
    // Add event listeners to filters
    senderFilter.addEventListener('change', filterNotifications);
    dateFilter.addEventListener('change', filterNotifications);
});

// Handle location button
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            // Use reverse geocoding to get the address
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                .then(response => response.json())
                .then(data => {
                    const locationInput = document.getElementById('location');
                    locationInput.value = data.display_name;
                })
                .catch(error => {
                    console.error('Error getting location:', error);
                    alert('Error getting location. Please enter it manually.');
                });
        }, function(error) {
            console.error('Error getting location:', error);
            alert('Error getting location. Please enter it manually.');
        });
    } else {
        alert('Geolocation is not supported by your browser. Please enter location manually.');
    }
}

// Format date helper function
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Handle new message form submission
document.getElementById('newMessageForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const recipient = document.getElementById('recipient').value;
    const subject = document.getElementById('subject').value;
    const content = document.getElementById('content').value;
    
    if (!recipient || !subject || !content) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: recipient,
                subject: subject,
                content: content
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Message sent successfully', 'success');
            closeModal('newMessageModal');
            document.getElementById('newMessageForm').reset();
            loadMessages(); // Refresh the messages list
        } else {
            showNotification(data.error || 'Failed to send message', 'error');
        }
    } catch (error) {
        showNotification('An error occurred while sending the message', 'error');
    }
});

// Load messages from the server
async function loadMessages() {
    try {
        const response = await fetch('/get_messages');
        const data = await response.json();
        
        if (data.success) {
            const messagesList = document.getElementById('messagesList');
            if (!messagesList) {
                console.error('Messages list container not found');
                return;
            }
            
            messagesList.innerHTML = '';
            
            if (data.messages.length === 0) {
                messagesList.innerHTML = '<div class="no-messages">No messages yet</div>';
                return;
            }
            
            data.messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.className = `message-item ${message.is_read ? '' : 'unread'}`;
                messageElement.setAttribute('data-message-id', message.id);
                
                const isSentByMe = message.sender_id === currentUserId;
                const otherParty = isSentByMe ? message.receiver_username : message.sender_username;
                const otherPartyRole = isSentByMe ? message.receiver_role : message.sender_role;
                
                messageElement.innerHTML = `
                    <div class="message-header">
                        <span class="message-sender">${otherParty} (${otherPartyRole})</span>
                        <span class="message-time">${formatDate(message.timestamp)}</span>
                    </div>
                    <div class="message-subject">${message.subject}</div>
                `;
                
                messageElement.addEventListener('click', () => viewMessage(message.id));
                messagesList.appendChild(messageElement);
            });
            
            // Update unread count
            updateUnreadCount();
        } else {
            console.error('Failed to load messages:', data.error);
            showNotification('Failed to load messages', 'error');
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Error loading messages', 'error');
    }
}

// View message details
async function viewMessage(messageId) {
    try {
        const response = await fetch(`/get_message/${messageId}`);
        const data = await response.json();
        
        if (data.success) {
            const message = data.data;
            const messageDetail = document.getElementById('messageDetail');
            if (!messageDetail) {
                console.error('Message detail container not found');
                return;
            }
            
            const isSentByMe = message.sender_id === currentUserId;
            const otherParty = isSentByMe ? message.receiver_username : message.sender_username;
            const otherPartyRole = isSentByMe ? message.receiver_role : message.sender_role;
            
            messageDetail.innerHTML = `
                <div class="message-detail-header">
                    <h3>${message.subject}</h3>
                    <div class="message-meta">
                        <span class="message-sender">From: ${message.sender_username} (${message.sender_role})</span>
                        <span class="message-receiver">To: ${message.receiver_username} (${message.receiver_role})</span>
                        <span class="message-time">${formatDate(message.timestamp)}</span>
                    </div>
                </div>
                <div class="message-content">${message.content}</div>
                <div class="message-actions">
                    <button class="btn btn-primary" onclick="replyToMessage(${isSentByMe ? message.receiver_id : message.sender_id})">
                        Reply
                    </button>
                </div>
            `;
            
            // Mark as read if unread
            if (!message.is_read && message.receiver_id === currentUserId) {
                await markMessageAsRead(messageId);
            }
        } else {
            console.error('Failed to load message:', data.error);
            showNotification('Failed to load message', 'error');
        }
    } catch (error) {
        console.error('Error loading message:', error);
        showNotification('Error loading message', 'error');
    }
}

// Mark message as read
async function markMessageAsRead(messageId) {
    try {
        console.log('Marking message as read:', messageId);
        const response = await fetch(`/mark_message_read/${messageId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                messageElement.classList.remove('unread');
            }
            updateUnreadCount();
        }
    } catch (error) {
        console.error('Failed to mark message as read:', error);
    }
}

// Reply to a message
function replyToMessage(recipientId) {
    console.log('Replying to user:', recipientId);
    const recipientSelect = document.getElementById('recipient');
    recipientSelect.value = recipientId;
    showNewMessageModal();
}

function updateUnreadCount(count) {
    const badge = document.querySelector('.notification-badge');
    if (count === undefined) {
        // If count is not provided, count unread messages in the list
        count = document.querySelectorAll('.message-item.unread').length;
    }
    
    if (badge) {
        badge.textContent = count || '';
        badge.style.display = count > 0 ? 'block' : 'none';
    }
}

// Initialize messages on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing messages...');
    loadMessages();
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
});

// Flash Message Handling
document.addEventListener('DOMContentLoaded', function() {
    // Close flash messages when clicking the close button
    document.querySelectorAll('.close-alert').forEach(button => {
        button.addEventListener('click', function() {
            const alert = this.parentElement;
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.remove();
            }, 300);
        });
    });

    // Auto-hide flash messages after 5 seconds
    document.querySelectorAll('.alert').forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    });
}); 
