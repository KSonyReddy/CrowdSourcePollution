// Initialize the map
let map;
let markers = [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize map centered on Telangana
    map = L.map('map').setView([17.3850, 78.4867], 7);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Fetch pollution data and add markers
    fetchPollutionData();
});

// Fetch pollution data from the server
async function fetchPollutionData() {
    try {
        const response = await fetch('/api/pollution_data');
        if (!response.ok) {
            throw new Error('Failed to fetch pollution data');
        }
        const data = await response.json();
        addMarkers(data);
    } catch (error) {
        console.error('Error fetching pollution data:', error);
        showNotification('Failed to load pollution data', 'error');
    }
}

// Add markers to the map
function addMarkers(data) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    data.forEach(point => {
        const marker = L.marker([point.latitude, point.longitude])
            .bindPopup(createPopupContent(point))
            .addTo(map);
        
        markers.push(marker);
    });
}

function createPopupContent(point) {
    const severityClass = getSeverityClass(point.severity);
    const severityText = point.severity.charAt(0).toUpperCase() + point.severity.slice(1);
    
    return `
        <div class="popup-content">
            <h3>${point.location}</h3>
            <p><strong>Type:</strong> ${point.type}</p>
            <p><strong>Level:</strong> ${point.level}</p>
            <p><strong>Pollution Levels:</strong></p>
<ul>
  ${Object.entries(point.types).map(([type, value]) => `<li>${type}: ${value}</li>`).join('')}
</ul>

            <p><strong>Reported:</strong> ${formatDate(point.timestamp)}</p>
            ${point.description ? `<p><strong>Description:</strong> ${point.description}</p>` : ''}
        </div>
    `;
}


// Get severity class based on pollution level
function getSeverityClass(severity) {
    switch (severity.toLowerCase()) {
        case 'high':
            return 'high';
        case 'moderate':
            return 'moderate';
        case 'low':
            return 'low';
        default:
            return 'moderate';
    }
}

// Format date for display
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show notification
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

// Refresh map data periodically (every 5 minutes)
setInterval(fetchPollutionData, 5 * 60 * 1000);

// Function to get color based on pollution level
function getPollutionColor(level) {
    switch (level.toLowerCase()) {
        case 'high':
            return '#ff4444';
        case 'moderate':
            return '#ffbb33';
        case 'low':
            return '#00C851';
        default:
            return '#666666';
    }
}

// Function to create a custom icon for markers
function createCustomIcon(pollutionLevel) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${getPollutionColor(pollutionLevel)}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
}

// Add event listener for the login button
document.querySelector('.login-button').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/login';
}); 
