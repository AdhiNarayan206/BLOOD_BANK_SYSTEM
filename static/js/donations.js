const API_URL = 'http://localhost:5000';

// Load donors for dropdown
async function loadDonors() {
    try {
        const response = await fetch(`${API_URL}/donors?is_active=true`);
        const donors = await response.json();
        
        const donorSelect = document.querySelector('select[name="donor_id"]');
        donors.forEach(donor => {
            const option = document.createElement('option');
            option.value = donor.donor_id;
            option.textContent = `${donor.name} (${donor.blood_group}) - ${donor.phone}`;
            donorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading donors:', error);
    }
}

// Load blood banks for dropdown
async function loadBloodBanks() {
    try {
        const response = await fetch(`${API_URL}/blood_banks`);
        const banks = await response.json();
        
        const bankSelect = document.querySelector('select[name="bank_id"]');
        banks.forEach(bank => {
            const option = document.createElement('option');
            option.value = bank.bank_id;
            option.textContent = `${bank.bank_name} - ${bank.location}`;
            bankSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading blood banks:', error);
    }
}

// Load all donations
async function loadDonations() {
    try {
        const response = await fetch(`${API_URL}/donations`);
        const donations = await response.json();
        displayDonations(donations);
    } catch (error) {
        console.error('Error loading donations:', error);
        showAlert('Error loading donations', 'error');
    }
}

// Display donations in table
function displayDonations(donations) {
    const tableBody = document.getElementById('donationsTableBody');
    tableBody.innerHTML = '';
    
    if (donations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">💉</div>
                    <div style="font-size: 1.2rem;">No donations recorded</div>
                </td>
            </tr>
        `;
        return;
    }
    
    donations.forEach(donation => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${donation.donation_id}</td>
            <td style="font-weight: 600;">${donation.donor_name || 'N/A'}</td>
            <td>${donation.bank_name || 'N/A'}</td>
            <td>${formatDate(donation.donation_date)}</td>
            <td><span class="badge badge-info">${donation.component_type}</span></td>
            <td style="font-weight: 600; font-size: 1.1rem;">${donation.quantity_units} units</td>
            <td>${formatDate(donation.expiry_date)}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Open record modal
function openRecordModal() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.querySelector('input[name="donation_date"]').value = today;
    
    // Set expiry date (35 days from now for whole blood)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 35);
    document.querySelector('input[name="expiry_date"]').value = expiryDate.toISOString().split('T')[0];
    
    document.getElementById('recordModal').classList.add('active');
    document.getElementById('recordForm').reset();
    
    // Reset the dates after form reset
    document.querySelector('input[name="donation_date"]').value = today;
    document.querySelector('input[name="expiry_date"]').value = expiryDate.toISOString().split('T')[0];
}

// Close record modal
function closeRecordModal() {
    document.getElementById('recordModal').classList.remove('active');
}

// Record donation
async function recordDonation(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const screeningId = formData.get('screening_id');
    
    const data = {
        donor_id: parseInt(formData.get('donor_id')),
        bank_id: parseInt(formData.get('bank_id')),
        donation_date: formData.get('donation_date'),
        component_type: formData.get('component_type'),
        quantity_units: parseInt(formData.get('quantity_units')),
        expiry_date: formData.get('expiry_date')
    };
    
    // Only include screening_id if it's provided
    if (screeningId && screeningId.trim() !== '') {
        data.screening_id = parseInt(screeningId);
    }
    
    try {
        const response = await fetch(`${API_URL}/donations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Donation recorded successfully!', 'success');
            closeRecordModal();
            loadDonations();
        } else {
            showAlert(result.error || 'Error recording donation', 'error');
        }
    } catch (error) {
        console.error('Error recording donation:', error);
        showAlert('Error recording donation', 'error');
    }
}

// Update expiry date based on component type
document.querySelector('select[name="component_type"]')?.addEventListener('change', (e) => {
    const donationDate = new Date(document.querySelector('input[name="donation_date"]').value);
    if (!donationDate || isNaN(donationDate)) return;
    
    const expiryDate = new Date(donationDate);
    const componentType = e.target.value;
    
    // Set expiry based on component type
    switch(componentType) {
        case 'Whole Blood':
            expiryDate.setDate(expiryDate.getDate() + 35); // 35 days
            break;
        case 'RBC':
            expiryDate.setDate(expiryDate.getDate() + 42); // 42 days
            break;
        case 'Platelets':
            expiryDate.setDate(expiryDate.getDate() + 5); // 5 days
            break;
        case 'Plasma':
            expiryDate.setDate(expiryDate.getDate() + 365); // 1 year
            break;
        default:
            expiryDate.setDate(expiryDate.getDate() + 35);
    }
    
    document.querySelector('input[name="expiry_date"]').value = expiryDate.toISOString().split('T')[0];
});

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
    alertDiv.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Close modal on outside click
window.onclick = function(event) {
    const recordModal = document.getElementById('recordModal');
    
    if (event.target === recordModal) {
        closeRecordModal();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadDonors();
    loadBloodBanks();
    loadDonations();
    
    // Refresh every 30 seconds
    setInterval(loadDonations, 30000);
});
