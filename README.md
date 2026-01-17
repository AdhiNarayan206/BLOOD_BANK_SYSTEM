# 🩸 Blood Bank Management System

A comprehensive database project for managing blood bank operations including donor registration, blood donations, inventory management, and hospital requests.

## 📋 Features

### Backend Features (Flask API)
- ✅ **Complete RESTful API** with proper error handling
- ✅ **Donor Management** - Register, update, delete, and search donors
- ✅ **Donor Health Tracking** - Record and retrieve health screening results
- ✅ **Donation Management** - Record donations with automatic stock updates
- ✅ **Blood Stock Inventory** - Real-time stock tracking with filters
- ✅ **Request Management** - Hospital blood requests with status tracking
- ✅ **Analytics Dashboard** - Real-time statistics and insights
- ✅ **Search & Filter** - Advanced search across all entities
- ✅ **Data Validation** - Input validation and error handling

### Frontend Features (HTML/CSS/JS)
- 🎨 **Modern Dark Theme** with glassmorphism effects
- 🎭 **Smooth Animations** and micro-interactions
- 📱 **Responsive Design** for all screen sizes
- 🎯 **Real-time Updates** with auto-refresh
- 🔍 **Advanced Search & Filtering**
- 📊 **Interactive Dashboard** with live statistics
- 💫 **Beautiful UI Components** - Cards, modals, forms
- ⚡ **Fast Performance** with optimized code

## 🛠️ Technology Stack

### Backend
- **Flask** - Python web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Flask-MySQLdb** - MySQL database integration
- **MySQL** - Relational database

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with variables, gradients, animations
- **Vanilla JavaScript** - No frameworks, pure JS
- **Fetch API** - RESTful API communication

## 📦 Installation

### Prerequisites
```bash
- Python 3.7+
- MySQL Server
- pip (Python package manager)
```

### Backend Setup

1. **Install Python dependencies:**
```bash
pip install flask flask-cors flask-mysqldb
```

2. **Configure MySQL Database:**
   - Update database credentials in `app.py`:
     ```python
     app.config['MYSQL_HOST'] = 'localhost'
     app.config['MYSQL_USER'] = 'your_username'
     app.config['MYSQL_PASSWORD'] = 'your_password'
     app.config['MYSQL_DB'] = 'blood_bank_db'
     ```

3. **Create the database and tables** according to your ER diagram

4. **Run the Flask application:**
```bash
python app.py
```
The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Open the project in a browser:**
   - Simply open `index.html` in a modern web browser
   - Or use a local server (recommended):
     ```bash
     python -m http.server 8000
     ```
   - Then navigate to `http://localhost:8000`

## 📁 Project Structure

```
BLOOD_BANK_SYSTEM/
├── app.py                      # Flask backend API
├── index.html                  # Dashboard page
├── donors.html                 # Donor management
├── donations.html              # Donation records
├── stock.html                  # Blood stock inventory
├── requests.html               # Hospital requests
├── static/
│   ├── css/
│   │   └── style.css          # Main stylesheet
│   └── js/
│       ├── dashboard.js       # Dashboard logic
│       ├── donors.js          # Donor management logic
│       ├── donations.js       # Donation management logic
│       ├── stock.js           # Stock management logic
│       └── requests.js        # Request management logic
└── README.md                   # Project documentation
```

## 🔌 API Endpoints

### Dashboard
- `GET /` - API information
- `GET /dashboard` - Dashboard statistics

### Donors
- `GET /donors` - Get all donors (supports filters: blood_group, city, is_active)
- `GET /donors/<id>` - Get specific donor
- `POST /register_donor` - Register new donor
- `PUT /donors/<id>` - Update donor
- `DELETE /donors/<id>` - Delete donor
- `GET /search/donors?q=<query>` - Search donors

### Donor Health
- `POST /donor_health` - Add health record
- `GET /donor_health/<donor_id>` - Get donor health history

### Donations
- `POST /donations` - Record new donation
- `GET /donations` - Get all donations

### Blood Stock
- `GET /stock` - Get blood stock (supports filters: blood_group, bank_id)

### Hospitals
- `GET /hospitals` - Get all hospitals
- `POST /hospitals` - Add new hospital

### Blood Banks
- `GET /blood_banks` - Get all blood banks
- `POST /blood_banks` - Add new blood bank

### Requests
- `GET /requests` - Get all requests (supports filters: status, blood_group)
- `POST /requests` - Create new request
- `PUT /requests/<id>` - Update request status
- `DELETE /requests/<id>` - Delete request

## 🎨 Design Features

### Color Palette
- **Primary Gradient**: Purple to indigo (#667eea → #764ba2)
- **Secondary Gradient**: Pink to coral (#f093fb → #f5576c)
- **Success Gradient**: Blue to cyan (#4facfe → #00f2fe)
- **Danger Gradient**: Pink to yellow (#fa709a → #fee140)

### UI Components
- 🎴 **Glass-morphic Cards** with backdrop blur
- 🌊 **Gradient Buttons** with hover effects
- 📊 **Animated Statistics** cards
- 🎯 **Modal Dialogs** for forms
- 🏷️ **Status Badges** with color coding
- 📱 **Responsive Tables** with smooth scrolling

## 🚀 Usage

### Register a Donor
1. Navigate to "Donors" page
2. Click "Register Donor" button
3. Fill in donor details
4. Submit the form

### Record a Donation
1. Navigate to "Donations" page
2. Click "Record Donation"
3. Select donor, blood bank, and component type
4. System auto-sets expiry dates based on component type
5. Submit to record

### Create Blood Request
1. Navigate to "Requests" page
2. Click "New Request"
3. Select hospital, blood group, and urgency
4. Submit request

### Monitor Blood Stock
1. Navigate to "Blood Stock" page
2. View real-time inventory
3. Filter by blood group or blood bank
4. Monitor stock levels (Critical/Low/Good)

## 📊 Database Schema

Based on your ER diagram, the system includes:

### Tables
- **DONOR** - Donor information
- **DONOR_HEALTH** - Health screening records
- **DONATION** - Donation records
- **BLOOD_STOCK** - Inventory management
- **BLOOD_BANK** - Blood bank locations
- **HOSPITAL** - Hospital information
- **BLOOD_REQUEST** - Hospital blood requests

### Key Relationships
- Donor ↔ Donor Health (1:N)
- Donor ↔ Donation (1:N)
- Blood Bank ↔ Donation (1:N)
- Blood Bank ↔ Blood Stock (1:N)
- Hospital ↔ Blood Request (1:N)

## 🔒 Security Considerations

For production deployment, consider adding:
- User authentication and authorization
- Input sanitization and validation
- SQL injection prevention (use parameterized queries)
- CSRF protection
- Rate limiting
- HTTPS encryption

## 📈 Future Enhancements

Potential improvements:
- 📧 Email notifications for low stock
- 📱 Mobile app version
- 📊 Advanced analytics and reporting
- 🔔 Real-time alerts for urgent requests
- 📝 PDF report generation
- 🌍 Multi-language support
- 🔐 Role-based access control

## 👥 Contributors

- Project developed for B.Tech Database Systems course
- Topic: Blood Bank Management System

## 📄 License

This project is created for educational purposes.

## 🆘 Support

For issues or questions:
1. Check the database connection settings
2. Ensure MySQL server is running
3. Verify all tables are created correctly
4. Check browser console for frontend errors
5. Review Flask logs for backend errors

---

**Made with ❤️ for B.Tech Database Systems Project**
