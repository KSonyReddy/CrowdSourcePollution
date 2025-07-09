// Initialize the map centered on Telangana
const map = L.map('map').setView([17.3850, 78.4867], 7);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Store markers and reports data
let markers = [];
let reports = [];
let districtData = {};

// Function to refresh map data
async function refreshMapData() {
    try {
        console.log('Refreshing map data...');
        const response = await fetch('/get_district_data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newData = await response.json();
        
        console.log('Received new data:', newData);
        
        // Update district data
        districtData = newData;
        
        // Clear existing markers
        if (markers && markers.length > 0) {
            markers.forEach(marker => {
                if (marker && map.hasLayer(marker)) {
                    marker.remove();
                }
            });
        }
        markers = [];
        
        // Add updated markers
        addDistrictMarkers();
        
        // Update reports summary
        updateReportsSummary();
        
        // Update info panel if a district is selected
        const selectedDistrict = document.getElementById('districtName');
        if (selectedDistrict && selectedDistrict.textContent !== 'District Information') {
            const districtInfo = districtData[selectedDistrict.textContent];
            if (districtInfo) {
                updateDistrictDetails(selectedDistrict.textContent, districtInfo);
            }
        }
        
        console.log('Map data refreshed successfully');
        return true;
    } catch (error) {
        console.error('Error refreshing map data:', error);
        return false;
    }
}

// Make refreshMapData available globally
window.refreshMapData = refreshMapData;

// Function to get color based on severity
function getSeverityColor(severity) {
    switch (severity.toLowerCase()) {
        case 'high':
            return '#ff4444'; // Red
        case 'moderate':
            return '#4444ff'; // Blue
        case 'low':
            return '#44ff44'; // Green
        default:
            return '#888888'; // Gray
    }
}

// Function to create custom marker icon
function createPopupContent(district, data) {
    if (!data) {
        return `<div class="popup-content">
            <h3>${district}</h3>
            <p><strong>No pollution data available.</strong></p>
        </div>`;
    }

    let content = `<div class="popup-content">
        <h3>${district}</h3>
        <div class="severity-indicator ${data.severity || ''}">Overall Severity: ${(data.severity || 'N/A').toUpperCase()}</div>
        <div class="pollution-types">
            <h4>Pollution Types:</h4>`;

    if (data.types) {
        for (const [type, value] of Object.entries(data.types)) {
            content += `
                <div class="pollution-type">
                    <span class="type-name">${type}:</span>
                    <span class="value">${value}</span>
                </div>`;
        }
    } else {
        content += `<div>No pollution type data.</div>`;
    }

    content += `
        </div>
    </div>`;

    return content;
}

// Function to update district details in the info panel
function updateDistrictDetails(districtName, districtInfo) {
    const districtDetails = document.getElementById('district-details');
    
    districtDetails.innerHTML = `
        <h3>${districtName}</h3>
        <div class="district-stats">
            <div class="stat-item">
                <span class="stat-label">Pollution Level:</span>
                <span class="severity ${districtInfo.severity.toLowerCase()}">${districtInfo.severity}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Pollution Type:</span>
                <span class="stat-value">${districtInfo.pollution_type}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Reports:</span>
                <span class="stat-value">${districtInfo.reports}</span>
            </div>
        </div>
    `;
}

// Function to update reports summary
function updateReportsSummary() {
    // Count reports by severity
    const severityCounts = {
        high: 0,
        moderate: 0,
        low: 0
    };
    
    // Count reports from district data
    Object.values(districtData).forEach(district => {
        if (district.severity.toLowerCase() === 'high') {
            severityCounts.high += district.reports;
        } else if (district.severity.toLowerCase() === 'moderate') {
            severityCounts.moderate += district.reports;
        } else if (district.severity.toLowerCase() === 'low') {
            severityCounts.low += district.reports;
        }
    });
    
    // Update the summary stats
    document.getElementById('total-reports').textContent = 
        severityCounts.high + severityCounts.moderate + severityCounts.low;
    document.getElementById('high-severity').textContent = severityCounts.high;
    document.getElementById('moderate-severity').textContent = severityCounts.moderate;
    document.getElementById('low-severity').textContent = severityCounts.low;
}

// Function to add district markers to the map
function addDistrictMarkers() {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    // Add markers for each district
    Object.entries(districtData).forEach(([districtName, districtInfo]) => {
        // Get district coordinates (this would normally come from a GeoJSON file)
        // For now, we'll use approximate coordinates for Telangana districts
        const coordinates = getDistrictCoordinates(districtName);
        
        if (coordinates) {
            const marker = L.marker(coordinates, {
                icon: createCustomIcon(districtInfo.severity)
            });
            
            marker.bindPopup(createPopupContent(districtName, districtInfo));
            marker.on('click', () => {
                updateDistrictDetails(districtName, districtInfo);
            });
            
            marker.addTo(map);
            markers.push(marker);
        }
    });
}

// Function to get approximate coordinates for Telangana districts
function getDistrictCoordinates(districtName) {
    // This would normally come from a GeoJSON file
    // For now, we'll use approximate coordinates for Telangana districts
    const coordinates = {
        'Adilabad': [19.6657, 78.5322],
        'Bhadradri Kothagudem': [17.5517, 80.6197],
        'Hyderabad': [17.3850, 78.4867],
        'Jagtial': [18.8000, 78.9167],
        'Jangaon': [17.7167, 79.1833],
        'Jayashankar Bhupalpally': [18.0500, 79.8167],
        'Jogulamba Gadwal': [16.2333, 77.8000],
        'Kamareddy': [18.3167, 78.3333],
        'Karimnagar': [18.4333, 79.1500],
        'Khammam': [17.2500, 80.1500],
        'Komaram Bheem Asifabad': [19.1167, 79.2833],
        'Mahabubabad': [17.6000, 80.0167],
        'Mahabubnagar': [16.7333, 77.9833],
        'Mancherial': [18.8667, 79.4667],
        'Medak': [18.0333, 78.2667],
        'Medchal–Malkajgiri': [17.6333, 78.4833],
        'Mulugu': [17.9333, 80.1833],
        'Nagarkurnool': [16.4833, 78.3167],
        'Nalgonda': [17.0500, 79.2667],
        'Narayanpet': [16.7500, 77.4833],
        'Nirmal': [19.1000, 78.3500],
        'Nizamabad': [18.6833, 78.1167],
        'Peddapalli': [18.6167, 79.3667],
        'Rajanna Sircilla': [18.3833, 78.8333],
        'Rangareddy': [17.3667, 78.5667],
        'Sangareddy': [17.6333, 78.0833],
        'Siddipet': [18.1000, 78.8500],
        'Suryapet': [17.1333, 79.6167],
        'Vikarabad': [17.3333, 77.9000],
        'Wanaparthy': [16.3667, 78.0667],
        'Warangal Rural': [17.9667, 79.6000],
        'Warangal Urban': [17.9667, 79.6000],
        'Yadadri Bhuvanagiri': [17.6167, 78.8833]
    };
    
    return coordinates[districtName] || null;
}

// Function to create custom icon
function createCustomIcon(severity) {
    return L.divIcon({
        className: 'custom-icon',
        html: `<div class="marker" style="background-color: ${getSeverityColor(severity)}"></div>`,
        iconSize: [20, 20]
    });
}

// Function to update district data with user reports
function updateDistrictDataWithReports() {
    // This function would normally update the district data based on user reports
    // For now, we'll just use the initial data
    // In a real application, this would aggregate reports by district and update the severity
    
    // Example of how this might work:
    // reports.forEach(report => {
    //     const district = determineDistrictFromLocation(report.location);
    //     if (district && districtData[district]) {
    //         districtData[district].reports++;
    //         // Update severity based on report severity
    //         if (report.severity === 'high' && districtData[district].severity !== 'high') {
    //             districtData[district].severity = 'high';
    //         } else if (report.severity === 'moderate' && districtData[district].severity === 'low') {
    //             districtData[district].severity = 'moderate';
    //         }
    //     }
    // });
}

// Function to update district info in the info panel
function updateDistrictInfo(district, data) {
    const infoPanel = document.getElementById('district-info');
    if (!infoPanel) return;

    let content = `
        <h2>${district}</h2>
        <div class="severity-indicator ${data.severity}">Overall Severity: ${data.severity.toUpperCase()}</div>
        <div class="pollution-types">
            <h3>Pollution Types:</h3>`;

    // Add each pollution type with its severity and value
    for (const [type, info] of Object.entries(data.pollution_types)) {
        content += `
            <div class="pollution-type">
                <span class="type-name">${type}</span>
                <span class="severity ${info.severity}">${info.severity.toUpperCase()}</span>
                <span class="value">${info.value} ${info.unit}</span>
            </div>`;
    }

    content += `
        </div>
        <div class="reports-count">Total Reports: ${data.reports}</div>`;

    infoPanel.innerHTML = content;
}

// Function to update pollution chart
function updatePollutionChart(data) {
    const ctx = document.getElementById('pollution-chart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (window.pollutionChart) {
        window.pollutionChart.destroy();
    }

    // Prepare data for the chart
    const labels = Object.keys(data.pollution_types);
    const values = Object.values(data.pollution_types).map(info => info.value);
    const backgroundColors = Object.values(data.pollution_types).map(info => getColor(info.severity));

    // Create new chart
    window.pollutionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pollution Levels',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Pollution Levels by Type'
                }
            }
        }
    });
}

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Get district data from the window object
    if (typeof window.districtData !== 'undefined') {
        districtData = window.districtData;
        
        // Check if there's a message indicating no reports
        if (districtData.message) {
            // Display message in the info panel
            const infoPanel = document.getElementById('district-info');
            if (infoPanel) {
                infoPanel.innerHTML = `
                    <h2>No Reports Available</h2>
                    <p>${districtData.message}</p>
                    <p>Please submit pollution reports to see data on the map.</p>
                `;
            }
            
            // Display message in the reports summary
            document.getElementById('total-reports').textContent = '0';
            document.getElementById('high-severity').textContent = '0';
            document.getElementById('moderate-severity').textContent = '0';
            document.getElementById('low-severity').textContent = '0';
            
            // Still add markers for districts, but with default values
            addDistrictMarkers();
            return;
        }
    }
    
    // Get reports data from the window object
    if (typeof window.reports !== 'undefined') {
        reports = window.reports;
    }
    
    // Update district data with user reports
    updateDistrictDataWithReports();
    
    // Add district markers to the map
    addDistrictMarkers();
    
    // Update reports summary
    updateReportsSummary();
    
    // Set up event listener for map clicks to clear district details
    map.on('click', () => {
        document.getElementById('district-details').innerHTML = '<p>Click on a district to view details</p>';
    });
    
    // Set up periodic refresh (every 30 seconds)
    setInterval(refreshMapData, 30000);
    
    // Initial refresh
    refreshMapData();
}); 
