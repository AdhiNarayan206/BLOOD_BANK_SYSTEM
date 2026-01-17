const API_URL = 'http://localhost:5000';

let allScreenings = [];

// Load donors for dropdown
async function loadDonors() {
    try {
        const response = await fetch(`${API_URL}/donors?is_active=true`);
        const donors = await response.json();
        
        const donorSelect = document.querySelector('select[name="donor_id"]');
        donors.forEach(donor => {
            const option = document.createElement('option');
            option.value = donor.donor_id;
            option.textContent = `${donor.name} (${donor.blood_group}) - ID: ${donor.donor_id}`;
            donorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading donors:', error);
    }
}

// Load all screenings with donor names
async function loadScreenings() {
    try {
        // First get all donors
        const donorsResponse = await fetch(`${API_URL}/donors`);
        const donors = await donorsResponse.json();
        
        // Create a map of donor_id to donor name
        const donorMap = {};
        donors.forEach(donor => {
            donorMap[donor.donor_id] = donor.name;
        });
        
        // Get all screening records
        const screeningPromises = donors.map(donor => 
            fetch(`${API_URL}/donor_health/${donor.donor_id}`)
                .then(r => r.json())
                .catch(() => [])
        );
        
        const screeningResults = await Promise.all(screeningPromises);
        
        // Flatten and add donor names
        allScreenings = screeningResults
            .flat()
            .map(screening => ({
                ...screening,
                donor_name: donorMap[screening.donor_id] || 'Unknown'
            }))
            .sort((a, b) => new Date(b.screening_date) - new Date(a.screening_date));
        
        displayScreenings(allScreenings);
    } catch (error) {
        console.error('Error loading screenings:', error);
        showAlert('Error loading screening records', 'error');
    }
}

// Display screenings in table
function displayScreenings(screenings) {
    const tableBody = document.getElementById('screeningsTableBody');
    tableBody.innerHTML = '';
    
    if (screenings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🏥</div>
                    <div style="font-size: 1.2rem;">No health screening records found</div>
                </td>
            </tr>
        `;
        return;
    }
    
    screenings.forEach(screening => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight: 700; color: var(--primary-color);">#${screening.health_id}</td>
            <td style="font-weight: 600;">${screening.donor_name}</td>
            <td>${formatDate(screening.screening_date)}</td>
            <td>${screening.bp || 'N/A'}</td>
            <td>${screening.weight || 'N/A'}</td>
            <td>${screening.disease_detected || 'None'}</td>
            <td>${getEligibilityBadge(screening.eligibility_status)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Get eligibility badge
function getEligibilityBadge(status) {
    if (status === 'Eligible') {
        return '<span class="badge badge-success">✅ Eligible</span>';
    } else {
        return '<span class="badge badge-danger">❌ Not Eligible</span>';
    }
}

// Open screening modal
function openScreeningModal() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.querySelector('input[name="screening_date"]').value = today;
    
    document.getElementById('screeningModal').classList.add('active');
    document.getElementById('screeningForm').reset();
    document.querySelector('input[name="screening_date"]').value = today;
}

// Close screening modal
function closeScreeningModal() {
    document.getElementById('screeningModal').classList.remove('active');
}

// Record screening
async function recordScreening(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        donor_id: parseInt(formData.get('donor_id')),
        screening_date: formData.get('screening_date'),
        bp: formData.get('bp') || null,
        weight: formData.get('weight') ? parseFloat(formData.get('weight')) : null,
        disease_detected: formData.get('disease_detected') || null,
        eligibility_status: formData.get('eligibility_status')
    };
    
    try {
        const response = await fetch(`${API_URL}/donor_health`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert(`✅ Health screening recorded! Screening ID: ${result.health_id}`, 'success');
            closeScreeningModal();
            loadScreenings();
        } else {
            showAlert(result.error || 'Error recording screening', 'error');
        }
    } catch (error) {
        console.error('Error recording screening:', error);
        showAlert('Error recording screening', 'error');
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '6rem';
    alertDiv.style.right = '2rem';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '400px';
    alertDiv.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Close modal on outside click
window.onclick = function(event) {
    const screeningModal = document.getElementById('screeningModal');
    
    if (event.target === screeningModal) {
        closeScreeningModal();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDonors();
    loadScreenings();
    
    // Refresh every 30 seconds
    setInterval(loadScreenings, 30000);
});
