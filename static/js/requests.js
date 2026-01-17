const API_URL = 'http://localhost:5000';
let allRequests = [];

// Load hospitals for dropdown
async function loadHospitals() {
    try {
        const response = await fetch(`${API_URL}/hospitals`);
        const hospitals = await response.json();
        
        const hospitalSelect = document.querySelector('select[name="hospital_id"]');
        hospitals.forEach(hospital => {
            const option = document.createElement('option');
            option.value = hospital.hospital_id;
            option.textContent = `${hospital.hospital_name} - ${hospital.location}`;
            hospitalSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading hospitals:', error);
    }
}

// Load all requests
async function loadRequests() {
    try {
        const response = await fetch(`${API_URL}/requests`);
        allRequests = await response.json();
        displayRequests(allRequests);
    } catch (error) {
        console.error('Error loading requests:', error);
        showAlert('Error loading requests', 'error');
    }
}

// Display requests in table
function displayRequests(requests) {
    const tableBody = document.getElementById('requestsTableBody');
    tableBody.innerHTML = '';
    
    if (requests.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                    <div style="font-size: 1.2rem;">No requests found</div>
                </td>
            </tr>
        `;
        return;
    }
    
    requests.forEach(req => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${req.request_id}</td>
            <td style="font-weight: 600;">${req.hospital_name}</td>
            <td>${req.location || 'N/A'}</td>
            <td><span class="blood-type blood-type-small">${req.blood_group}</span></td>
            <td>${req.component_type}</td>
            <td style="font-weight: 600;">${req.quantity_units} units</td>
            <td>${getUrgencyBadge(req.urgency_level)}</td>
            <td>${getStatusBadge(req.status)}</td>
            <td>${formatDate(req.request_date)}</td>
            <td>
                <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="openUpdateModal(${req.request_id}, '${req.status}')">
                    Update
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Filter by status
document.getElementById('filterStatus')?.addEventListener('change', async (e) => {
    const status = e.target.value;
    const bloodGroup = document.getElementById('filterBloodGroup').value;
    
    let url = `${API_URL}/requests?`;
    if (status) url += `status=${status}&`;
    if (bloodGroup) url += `blood_group=${bloodGroup}`;
    
    try {
        const response = await fetch(url);
        const filtered = await response.json();
        displayRequests(filtered);
    } catch (error) {
        console.error('Error filtering requests:', error);
    }
});

// Filter by blood group
document.getElementById('filterBloodGroup')?.addEventListener('change', async (e) => {
    const bloodGroup = e.target.value;
    const status = document.getElementById('filterStatus').value;
    
    let url = `${API_URL}/requests?`;
    if (status) url += `status=${status}&`;
    if (bloodGroup) url += `blood_group=${bloodGroup}`;
    
    try {
        const response = await fetch(url);
        const filtered = await response.json();
        displayRequests(filtered);
    } catch (error) {
        console.error('Error filtering requests:', error);
    }
});

// Open create modal
function openCreateModal() {
    document.getElementById('createModal').classList.add('active');
    document.getElementById('createForm').reset();
}

// Close create modal
function closeCreateModal() {
    document.getElementById('createModal').classList.remove('active');
}

// Create request
async function createRequest(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        hospital_id: parseInt(formData.get('hospital_id')),
        blood_group: formData.get('blood_group'),
        component_type: formData.get('component_type'),
        quantity_units: parseInt(formData.get('quantity_units')),
        urgency_level: formData.get('urgency_level')
    };
    
    try {
        const response = await fetch(`${API_URL}/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Blood request created successfully!', 'success');
            closeCreateModal();
            loadRequests();
        } else {
            showAlert(result.error || 'Error creating request', 'error');
        }
    } catch (error) {
        console.error('Error creating request:', error);
        showAlert('Error creating request', 'error');
    }
}

// Open update modal
function openUpdateModal(requestId, currentStatus) {
    document.getElementById('updateRequestId').value = requestId;
    document.querySelector('#updateForm select[name="status"]').value = currentStatus;
    document.getElementById('updateModal').classList.add('active');
}

// Close update modal
function closeUpdateModal() {
    document.getElementById('updateModal').classList.remove('active');
}

// Update request status
async function updateRequestStatus(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const requestId = formData.get('request_id');
    const data = {
        status: formData.get('status')
    };
    
    try {
        const response = await fetch(`${API_URL}/requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Request status updated successfully!', 'success');
            closeUpdateModal();
            loadRequests();
        } else {
            showAlert(result.error || 'Error updating request', 'error');
        }
    } catch (error) {
        console.error('Error updating request:', error);
        showAlert('Error updating request', 'error');
    }
}

// Get urgency badge
function getUrgencyBadge(urgency) {
    const urgencyMap = {
        'Critical': '<span class="badge badge-danger">🔴 Critical</span>',
        'High': '<span class="badge badge-warning">🟠 High</span>',
        'Medium': '<span class="badge badge-info">🟡 Medium</span>',
        'Low': '<span class="badge badge-primary">🟢 Low</span>'
    };
    return urgencyMap[urgency] || '<span class="badge badge-primary">Unknown</span>';
}

// Get status badge
function getStatusBadge(status) {
    const statusMap = {
        'Pending': '<span class="badge badge-warning">Pending</span>',
        'Approved': '<span class="badge badge-info">Approved</span>',
        'Fulfilled': '<span class="badge badge-success">Fulfilled</span>',
        'Rejected': '<span class="badge badge-danger">Rejected</span>',
        'Cancelled': '<span class="badge badge-danger">Cancelled</span>'
    };
    return statusMap[status] || '<span class="badge badge-primary">' + status + '</span>';
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

// Close modals on outside click
window.onclick = function(event) {
    const createModal = document.getElementById('createModal');
    const updateModal = document.getElementById('updateModal');
    
    if (event.target === createModal) {
        closeCreateModal();
    }
    if (event.target === updateModal) {
        closeUpdateModal();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHospitals();
    loadRequests();
    
    // Refresh every 30 seconds
    setInterval(loadRequests, 30000);
});
