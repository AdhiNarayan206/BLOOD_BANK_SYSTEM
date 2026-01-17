const API_URL = 'http://localhost:5000';

const bloodGroupColors = {
    'A+': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'A-': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'B+': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'B-': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'AB+': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'AB-': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'O+': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'O-': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
};

let allStock = [];
let allBanks = [];

// Load blood banks
async function loadBloodBanks() {
    try {
        const response = await fetch(`${API_URL}/blood_banks`);
        allBanks = await response.json();
        
        const filterBank = document.getElementById('filterBank');
        allBanks.forEach(bank => {
            const option = document.createElement('option');
            option.value = bank.bank_id;
            option.textContent = `${bank.bank_name} - ${bank.location}`;
            filterBank.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading blood banks:', error);
    }
}

// Load stock
async function loadStock() {
    try {
        const response = await fetch(`${API_URL}/stock`);
        allStock = await response.json();
        displayStockGrid();
        displayStockTable(allStock);
    } catch (error) {
        console.error('Error loading stock:', error);
        showAlert('Error loading stock data', 'error');
    }
}

// Display stock grid
function displayStockGrid() {
    const stockGrid = document.getElementById('stockGrid');
    stockGrid.innerHTML = '';
    
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    // Calculate total units per blood group (include all stock regardless of status)
    const stockByGroup = {};
    bloodGroups.forEach(group => {
        stockByGroup[group] = allStock
            .filter(s => s.blood_group === group)
            .reduce((sum, s) => sum + (s.quantity_units || 0), 0);
    });
    
    bloodGroups.forEach(group => {
        const units = stockByGroup[group] || 0;
        
        const stockCard = document.createElement('div');
        stockCard.className = 'card';
        stockCard.style.background = bloodGroupColors[group];
        stockCard.style.color = 'white';
        stockCard.style.padding = '1.5rem';
        stockCard.style.textAlign = 'center';
        
        let statusEmoji = '✓ Good Stock';
        let statusColor = 'rgba(255,255,255,0.9)';
        
        if (units === 0) {
            statusEmoji = '❌ Out of Stock';
        } else if (units < 10) {
            statusEmoji = '⚠️ Critical';
        } else if (units < 30) {
            statusEmoji = '⚡ Low';
        }
        
        stockCard.innerHTML = `
            <div style="font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem;">${group}</div>
            <div style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem;">${units} Units</div>
            <div style="opacity: 0.95; font-size: 0.95rem; font-weight: 600;">${statusEmoji}</div>
        `;
        
        stockGrid.appendChild(stockCard);
    });
}

// Sorting state
let currentSortColumn = null;
let currentSortOrder = 'asc';

// Display stock table
function displayStockTable(stock) {
    const tableBody = document.getElementById('stockTableBody');
    tableBody.innerHTML = '';
    
    if (stock.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                    <div style="font-size: 1.2rem;">No stock records found</div>
                </td>
            </tr>
        `;
        return;
    }
    
    stock.forEach(item => {
        const row = document.createElement('tr');
        
        let statusBadge = '<span class="badge badge-success">Available</span>';
        if (item.status === 'Low') {
            statusBadge = '<span class="badge badge-warning">Low</span>';
        } else if (item.status === 'Out of Stock') {
            statusBadge = '<span class="badge badge-danger">Out of Stock</span>';
        } else if (!item.status) {
            statusBadge = '<span class="badge badge-info">Available</span>';
        }
        
        row.innerHTML = `
            <td>#${item.stock_id}</td>
            <td style="font-weight: 600;">${item.bank_name}</td>
            <td>${item.location || 'N/A'}</td>
            <td><span class="blood-type blood-type-small">${item.blood_group}</span></td>
            <td style="font-weight: 600; font-size: 1.1rem;" data-value="${item.quantity_units}">${item.quantity_units} units</td>
            <td>${statusBadge}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Sort table
function sortTable(column, order = 'asc') {
    let sortedStock = [...allStock];
    
    sortedStock.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        // Handle numeric columns
        if (column === 'quantity_units' || column === 'stock_id' || column === 'bank_id') {
            aVal = Number(aVal) || 0;
            bVal = Number(bVal) || 0;
        } else {
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();
        }
        
        if (order === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
    
    displayStockTable(sortedStock);
}

// Add click handlers to table headers for sorting
function initTableSorting() {
    const headers = document.querySelectorAll('.table thead th');
    const sortableColumns = ['stock_id', 'bank_name', 'location', 'blood_group', 'quantity_units', 'status'];
    
    headers.forEach((header, index) => {
        if (index < sortableColumns.length) {
            header.style.cursor = 'pointer';
            header.style.userSelect = 'none';
            header.title = 'Click to sort';
            
            // Add sort icon
            const sortIcon = document.createElement('span');
            sortIcon.style.marginLeft = '0.5rem';
            sortIcon.style.opacity = '0.5';
            sortIcon.textContent = '↕️';
            header.appendChild(sortIcon);
            
            header.addEventListener('click', () => {
                const column = sortableColumns[index];
                
                // Toggle sort order if same column, otherwise default to asc
                if (currentSortColumn === column) {
                    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortColumn = column;
                    currentSortOrder = 'asc';
                }
                
                // Update sort icons
                headers.forEach(h => {
                    const icon = h.querySelector('span');
                    if (icon) icon.textContent = '↕️';
                });
                sortIcon.textContent = currentSortOrder === 'asc' ? '↑' : '↓';
                sortIcon.style.opacity = '1';
                
                sortTable(column, currentSortOrder);
            });
        }
    });
}

// Filter by blood group
document.getElementById('filterBloodGroup')?.addEventListener('change', async (e) => {
    const bloodGroup = e.target.value;
    const bankId = document.getElementById('filterBank').value;
    
    let url = `${API_URL}/stock?`;
    if (bloodGroup) url += `blood_group=${bloodGroup}&`;
    if (bankId) url += `bank_id=${bankId}`;
    
    try {
        const response = await fetch(url);
        const filtered = await response.json();
        displayStockTable(filtered);
    } catch (error) {
        console.error('Error filtering stock:', error);
    }
});

// Filter by bank
document.getElementById('filterBank')?.addEventListener('change', async (e) => {
    const bankId = e.target.value;
    const bloodGroup = document.getElementById('filterBloodGroup').value;
    
    let url = `${API_URL}/stock?`;
    if (bloodGroup) url += `blood_group=${bloodGroup}&`;
    if (bankId) url += `bank_id=${bankId}`;
    
    try {
        const response = await fetch(url);
        const filtered = await response.json();
        displayStockTable(filtered);
    } catch (error) {
        console.error('Error filtering stock:', error);
    }
});

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBloodBanks();
    loadStock();
    
    // Initialize table sorting after a short delay to ensure table is rendered
    setTimeout(() => {
        initTableSorting();
    }, 500);
    
    // Refresh every 30 seconds
    setInterval(loadStock, 30000);
});
