// Global variables
let currentSection = 'dashboard';
let charts = {};

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const awardModal = document.getElementById('awardModal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const awardForm = document.getElementById('awardForm');
const filterSelects = document.querySelectorAll('.filter-select');

// Create modals for other sections
document.addEventListener('DOMContentLoaded', () => {
    // Create New Message Modal
    const newMessageModal = document.createElement('div');
    newMessageModal.id = 'newMessageModal';
    newMessageModal.className = 'modal';
    newMessageModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>New Message</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="newMessageForm" class="modal-body">
                <div class="form-group">
                    <label for="recipient">Send To:</label>
                    <select id="recipient" name="recipient" required>
                        <option value="">Select Recipient</option>
                        <option value="admin">Admin</option>
                        <option value="all_users">All Users</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="messageSubject">Subject:</label>
                    <input type="text" id="messageSubject" name="subject" required>
                </div>
                <div class="form-group">
                    <label for="messageContent">Message:</label>
                    <textarea id="messageContent" name="content" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Send Message</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('newMessageModal')">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(newMessageModal);

    // Create Profile Modal
    const profileModal = document.createElement('div');
    profileModal.id = 'profileModal';
    profileModal.className = 'modal';
    profileModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Profile Information</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="profile-info">
                    <div class="profile-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="profile-details">
                        <h3 id="profileUsername"></h3>
                        <p id="profileEmail"></p>
                        <p id="profileRole"></p>
                        <p id="profileConstituency"></p>
                        <p id="profileLocality"></p>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('profileModal')">Close</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(profileModal);

    // Create Add Volunteer Modal
    const addVolunteerModal = document.createElement('div');
    addVolunteerModal.id = 'addVolunteerModal';
    addVolunteerModal.className = 'modal';
    addVolunteerModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Volunteer</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="addVolunteerForm" class="modal-body">
                <div class="form-group">
                    <label for="volunteerUsername">Username:</label>
                    <input type="text" id="volunteerUsername" name="username" required>
                </div>
                <div class="form-group">
                    <label for="volunteerEmail">Email:</label>
                    <input type="email" id="volunteerEmail" name="email" required>
                </div>
                <div class="form-group">
                    <label for="volunteerPassword">Password:</label>
                    <input type="password" id="volunteerPassword" name="password" required>
                </div>
                <div class="form-group">
                    <label for="volunteerConstituency">Constituency:</label>
                    <input type="text" id="volunteerConstituency" name="constituency" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Volunteer</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('addVolunteerModal')">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(addVolunteerModal);

    // Create Locality Modal
    const localityModal = document.createElement('div');
    localityModal.id = 'localityModal';
    localityModal.className = 'modal';
    localityModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Set Your Locality</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="localityForm" class="modal-body">
                <div class="form-group">
                    <label for="locality">Locality/District:</label>
                    <input type="text" id="locality" name="locality" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save Locality</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('localityModal')">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(localityModal);

    // Create View Report Modal
    const viewReportModal = document.createElement('div');
    viewReportModal.id = 'viewReportModal';
    viewReportModal.className = 'modal';
    viewReportModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Report Details</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="report-details">
                    <h3 id="reportTitle"></h3>
                    <div class="report-meta">
                        <span id="reportLocation"></span>
                        <span id="reportType"></span>
                        <span id="reportSeverity"></span>
                        <span id="reportTime"></span>
                        <span id="reportUser"></span>
                    </div>
                    <div class="report-description">
                        <p id="reportDescription"></p>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('viewReportModal')">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(viewReportModal);

    // Create Assign Volunteer Modal
    const assignVolunteerModal = document.createElement('div');
    assignVolunteerModal.id = 'assignVolunteerModal';
    assignVolunteerModal.className = 'modal';
    assignVolunteerModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Assign Volunteer</h2>
                <button class="close-modal">&times;</button>
            </div>
            <form id="assignVolunteerForm" class="modal-body">
                <input type="hidden" id="reportId" name="report_id">
                <div class="form-group">
                    <label for="volunteerSelect">Select Volunteer:</label>
                    <select id="volunteerSelect" name="volunteer_id" required>
                        <option value="">Select a volunteer</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="assignmentNotes">Notes:</label>
                    <textarea id="assignmentNotes" name="notes"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Assign</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('assignVolunteerModal')">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(assignVolunteerModal);

    // Add event listeners for all close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.closest('.modal').id;
            closeModal(modalId);
        });
    });

    // Add event listeners for form submissions
    document.getElementById('newMessageForm').addEventListener('submit', handleNewMessage);
    document.getElementById('addVolunteerForm').addEventListener('submit', handleAddVolunteer);
    document.getElementById('assignVolunteerForm').addEventListener('submit', handleAssignVolunteer);
    document.getElementById('localityForm').addEventListener('submit', handleSetLocality);
});

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeCharts();
    initializeEventListeners();
    showSection('dashboard');
});

// Navigation functions
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link:not([href*="logout"])');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
    
    currentSection = sectionId;
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    // Form submissions
    document.getElementById('newMessageForm')?.addEventListener('submit', handleNewMessage);
    document.getElementById('addVolunteerForm')?.addEventListener('submit', handleAddVolunteer);
    document.getElementById('giveAwardForm')?.addEventListener('submit', handleGiveAward);
    document.getElementById('editProfileForm')?.addEventListener('submit', handleEditProfile);
    document.getElementById('setLocalityForm')?.addEventListener('submit', handleSetLocality);
    document.getElementById('assignVolunteerForm')?.addEventListener('submit', handleAssignVolunteer);

    // Filters
    document.getElementById('severityFilter')?.addEventListener('change', filterReports);
    document.getElementById('typeFilter')?.addEventListener('change', filterReports);
}

// Message handling functions
async function handleNewMessage(event) {
    event.preventDefault();
    
    const recipient = document.getElementById('recipient').value;
    const subject = document.getElementById('subject').value;
    const content = document.getElementById('content').value;
    
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
            showNotification('Message sent successfully!', 'success');
            closeModal('messageModal');
            document.getElementById('newMessageForm').reset();
            
            // Update unread messages count if sending to admin
            if (recipient === 'admin') {
                const badge = document.querySelector('.notification-badge');
                if (badge) {
                    const currentCount = parseInt(badge.textContent) || 0;
                    badge.textContent = currentCount + 1;
                    badge.style.display = 'inline-block';
                }
            }
            
            // Refresh messages section if it's visible
            const messagesSection = document.getElementById('messagesSection');
            if (messagesSection && messagesSection.style.display !== 'none') {
                showSection('messages');
            }
        } else {
            showNotification(data.error || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to send message', 'error');
    }
}

function onEachFeature(feature, layer) {
    const district = feature.properties.name?.trim();

    // Log district keys only once (outside of this function ideally)
    console.log("📌 Keys in districtPollutionData:", Object.keys(districtPollutionData));

    const data = districtPollutionData[district];

    console.log("🧪 District:", district);
    console.log("🧪 Data:", data);

    const popupContent = createPopupContent(district, data);
    layer.bindPopup(popupContent);
}
L.geoJson(data.json, {
    onEachFeature: onEachFeature
}).addTo(map);

async function populateRecipientOptions() {
    try {
        const response = await fetch('/get_recipients');
        if (response.ok) {
            const data = await response.json();
            const recipientSelect = document.getElementById('recipient');
            
            // Clear existing options except the default ones
            const defaultOptions = Array.from(recipientSelect.options).filter(option => 
                option.value === '' || option.value === 'admin' || option.value === 'all_users'
            );
            recipientSelect.innerHTML = '';
            defaultOptions.forEach(option => recipientSelect.appendChild(option));
            
            // Add volunteer options
            if (data.volunteers) {
                const volunteersOptgroup = document.createElement('optgroup');
                volunteersOptgroup.label = 'Volunteers';
                
                data.volunteers.forEach(volunteer => {
                    const option = document.createElement('option');
                    option.value = volunteer.id;
                    option.textContent = volunteer.username;
                    volunteersOptgroup.appendChild(option);
                });
                
                recipientSelect.appendChild(volunteersOptgroup);
            }
        }
    } catch (error) {
        console.error('Error loading recipients:', error);
        showNotification('Error loading recipients', 'error');
    }
}

// Form handlers
async function handleAddVolunteer(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/add_volunteer', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            closeModal('addVolunteerModal');
            form.reset();
            showNotification('Volunteer added successfully', 'success');
            // Refresh volunteers section
            location.reload();
        } else {
            throw new Error('Failed to add volunteer');
        }
    } catch (error) {
        showNotification('Error adding volunteer', 'error');
    }
}

async function handleGiveAward(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/give_award', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            closeModal('giveAwardModal');
            form.reset();
            showNotification('Award given successfully', 'success');
            // Refresh awards section
            location.reload();
        } else {
            throw new Error('Failed to give award');
        }
    } catch (error) {
        showNotification('Error giving award', 'error');
    }
}

async function handleEditProfile(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/edit_profile', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            closeModal('editProfileModal');
            showNotification('Profile updated successfully', 'success');
            // Refresh profile section
            location.reload();
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        showNotification('Error updating profile', 'error');
    }
}

async function handleSetLocality(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/set_locality', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            closeModal('setLocalityModal');
            form.reset();
            showNotification('Locality set successfully', 'success');
            // Refresh profile section
            location.reload();
        } else {
            throw new Error('Failed to set locality');
        }
    } catch (error) {
        showNotification('Error setting locality', 'error');
    }
}

async function handleAssignVolunteer(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/assign_volunteer', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            closeModal('assignVolunteerModal');
            form.reset();
            showNotification('Volunteer assigned successfully', 'success');
            // Refresh reports section
            location.reload();
        } else {
            throw new Error('Failed to assign volunteer');
        }
    } catch (error) {
        showNotification('Error assigning volunteer', 'error');
    }
}

// Report functions
function filterReports() {
    const severityFilter = document.getElementById('severityFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const reports = document.querySelectorAll('.report-card');
    
    reports.forEach(report => {
        const severity = report.getAttribute('data-severity');
        const type = report.getAttribute('data-type');
        
        const severityMatch = severityFilter === 'all' || severity === severityFilter;
        const typeMatch = typeFilter === 'all' || type === typeFilter;
        
        report.style.display = severityMatch && typeMatch ? 'block' : 'none';
    });
}

async function viewReport(reportId) {
    try {
        const response = await fetch(`/get_report/${reportId}`);
        const report = await response.json();
        
        const detailsContainer = document.getElementById('reportDetails');
        detailsContainer.innerHTML = `
            <div class="report-details">
                <h3>${report.title}</h3>
                <div class="report-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${report.location}</span>
                    <span><i class="fas fa-calendar"></i> ${report.date}</span>
                    <span><i class="fas fa-user"></i> ${report.reporter}</span>
                    <span class="severity-badge ${report.severity.toLowerCase()}">${report.severity}</span>
                </div>
                <p>${report.description}</p>
                <div class="report-actions">
                    <button class="btn btn-primary btn-sm" onclick="assignVolunteer(${report.id})">Assign Volunteer</button>
                </div>
            </div>
        `;
        
        showModal('viewReportModal');
    } catch (error) {
        showNotification('Error loading report details', 'error');
    }
}

function assignVolunteer(reportId) {
    document.getElementById('reportId').value = reportId;
    showModal('assignVolunteerModal');
}

// Volunteer functions
function giveAward(volunteerId) {
    document.getElementById('awardRecipient').value = volunteerId;
    showModal('giveAwardModal');
}

async function viewVolunteerProfile(volunteerId) {
    try {
        const response = await fetch(`/get_volunteer/${volunteerId}`);
        const volunteer = await response.json();
        
        // Show volunteer profile in a modal or navigate to profile page
        showNotification('Volunteer profile loaded', 'success');
    } catch (error) {
        showNotification('Error loading volunteer profile', 'error');
    }
}

// Message functions
async function markAsRead(messageId) {
    try {
        const response = await fetch(`/mark_message_read/${messageId}`, {
            method: 'POST'
        });

        const data = await response.json();
        
        if (response.ok) {
            // Update UI to reflect the read status
            const messageCard = document.querySelector(`.message-card[data-message-id="${messageId}"]`);
            if (messageCard) {
                messageCard.classList.remove('unread');
                const actionButton = messageCard.querySelector('.message-actions');
                if (actionButton) {
                    actionButton.remove();
                }
            }
            
            // Update unread count in the sidebar
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                const currentCount = parseInt(badge.textContent);
                if (currentCount > 1) {
                    badge.textContent = currentCount - 1;
                } else {
                    badge.remove();
                }
            }
            
            showNotification('Message marked as read', 'success');
        } else {
            showNotification(data.error || 'Failed to mark message as read', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('An error occurred while updating the message', 'error');
    }
}

// Chart functions
function initializeCharts() {
    // Reports by Type Chart
    const reportsByTypeCtx = document.getElementById('reportsByTypeChart')?.getContext('2d');
    if (reportsByTypeCtx) {
        charts.reportsByType = new Chart(reportsByTypeCtx, {
            type: 'pie',
            data: {
                labels: ['Air', 'Water', 'Soil', 'Noise'],
                datasets: [{
                    data: [30, 25, 20, 15],
                    backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Reports by Severity Chart
    const reportsBySeverityCtx = document.getElementById('reportsBySeverityChart')?.getContext('2d');
    if (reportsBySeverityCtx) {
        charts.reportsBySeverity = new Chart(reportsBySeverityCtx, {
            type: 'bar',
            data: {
                labels: ['Low', 'Moderate', 'High', 'Critical'],
                datasets: [{
                    label: 'Number of Reports',
                    data: [40, 30, 20, 10],
                    backgroundColor: ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Report Trends Chart
    const reportTrendsCtx = document.getElementById('reportTrendsChart')?.getContext('2d');
    if (reportTrendsCtx) {
        charts.reportTrends = new Chart(reportTrendsCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Reports',
                    data: [65, 59, 80, 81, 56, 55],
                    borderColor: '#3498db',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Volunteer Activity Chart
    const volunteerActivityCtx = document.getElementById('volunteerActivityChart')?.getContext('2d');
    if (volunteerActivityCtx) {
        charts.volunteerActivity = new Chart(volunteerActivityCtx, {
            type: 'bar',
            data: {
                labels: ['Reports', 'Awards', 'Messages', 'Actions'],
                datasets: [{
                    label: 'Activity Level',
                    data: [75, 45, 60, 80],
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Close all modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Message tab switching
function switchMessageTab(tab) {
    // Hide all message lists
    document.querySelectorAll('.messages-list').forEach(list => {
        list.classList.remove('active');
    });
    
    // Show the selected tab's content
    document.getElementById(`${tab}-messages`).classList.add('active');
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    event.target.classList.add('active');
} 
