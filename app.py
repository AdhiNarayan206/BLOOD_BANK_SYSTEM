from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mysqldb import MySQL
from MySQLdb.cursors import DictCursor
from datetime import date, datetime, timedelta
import traceback

app = Flask(__name__)
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'A1d2h3i4*x'
app.config['MYSQL_DB'] = 'blood_bank_db'
mysql = MySQL(app)
CORS(app)

# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500

# ==================== DASHBOARD & ANALYTICS ====================
@app.route("/")
def index():
    return jsonify({"message": "Blood Bank Management System API", "version": "1.0"})

@app.route("/dashboard", methods=['GET'])
def get_dashboard():
    try:
        cur = mysql.connection.cursor(DictCursor)
        
        # Total donors
        cur.execute("SELECT COUNT(*) as total FROM donor WHERE is_active = 1")
        total_donors = cur.fetchone()['total']
        
        # Total donations
        cur.execute("SELECT COUNT(*) as total FROM donation")
        total_donations = cur.fetchone()['total']
        
        # Blood stock by blood group (aggregate across all banks)
        cur.execute("""
            SELECT blood_group, SUM(quantity_units) as total_units 
            FROM blood_stock 
            GROUP BY blood_group
        """)
        stock_by_group = cur.fetchall()
        
        # Pending requests
        cur.execute("SELECT COUNT(*) as total FROM blood_request WHERE status = 'Pending'")
        pending_requests = cur.fetchone()['total']
        
        # Recent donations (last 7 days)
        cur.execute("""
            SELECT COUNT(*) as total 
            FROM donation 
            WHERE donation_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        """)
        recent_donations = cur.fetchone()['total']
        
        cur.close()
        
        return jsonify({
            "total_donors": total_donors,
            "total_donations": total_donations,
            "stock_by_group": stock_by_group,
            "pending_requests": pending_requests,
            "recent_donations": recent_donations
        })
    except Exception as e:
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

# ==================== DONOR MANAGEMENT ====================
@app.route("/donors", methods=['GET'])
def get_donors():
    try:
        cur = mysql.connection.cursor(DictCursor)
        
        # Get query parameters for filtering
        blood_group = request.args.get('blood_group')
        city = request.args.get('city')
        is_active = request.args.get('is_active')
        
        query = "SELECT donor_id, name, age, gender, blood_group, phone, email, address, city, is_active, donor_type FROM donor WHERE 1=1"
        params = []
        
        if blood_group:
            query += " AND blood_group = %s"
            params.append(blood_group)
        if city:
            query += " AND city = %s"
            params.append(city)
        if is_active:
            query += " AND is_active = %s"
            params.append(1 if is_active.lower() == 'true' else 0)
        
        cur.execute(query, tuple(params))
        donors = cur.fetchall()
        cur.close()
        return jsonify(donors)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/donors/<int:donor_id>", methods=['GET'])
def get_donor(donor_id):
    try:
        cur = mysql.connection.cursor(DictCursor)
        cur.execute(
            "SELECT donor_id, name, age, gender, blood_group, phone, email, address, city, is_active, donor_type FROM donor WHERE donor_id = %s",
            (donor_id,),
        )
        donor = cur.fetchone()
        cur.close()
        if donor is None:
            return jsonify({"error": "Donor not found"}), 404
        return jsonify(donor)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/register_donor", methods=['POST'])
def register_donor():
    try:
        data = request.json
        
        # Validation
        required_fields = ['name', 'age', 'gender', 'blood_group', 'contact']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        name = data['name']
        age = int(data['age'])
        gender = data['gender']
        blood_group = data['blood_group']
        contact = data['contact']
        address = data.get('address', '')
        email = data.get('email', '')
        city = data.get('city', '')

        cur = mysql.connection.cursor()
        
        # Try with all fields first
        try:
            cur.execute(
                "INSERT INTO donor (name, age, gender, blood_group, phone, address, email, city) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (name, age, gender, blood_group, contact, address, email, city)
            )
        except Exception as db_error:
            # If city column doesn't exist, try without it
            print(f"First insert failed: {db_error}")
            print("Trying without city column...")
            cur.execute(
                "INSERT INTO donor (name, age, gender, blood_group, phone, address, email) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (name, age, gender, blood_group, contact, address, email)
            )
        
        mysql.connection.commit()
        donor_id = cur.lastrowid
        cur.close()
        return jsonify({"message": "Donor registered successfully", "donor_id": donor_id}), 201
    except Exception as e:
        print(f"ERROR in register_donor: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e), "details": "Check server console for more information"}), 500

@app.route("/donors/<int:donor_id>", methods=['PUT'])
def update_donor(donor_id):
    try:
        data = request.json
        cur = mysql.connection.cursor()
        
        update_fields = []
        params = []
        
        if 'name' in data:
            update_fields.append("name = %s")
            params.append(data['name'])
        if 'age' in data:
            update_fields.append("age = %s")
            params.append(int(data['age']))
        if 'gender' in data:
            update_fields.append("gender = %s")
            params.append(data['gender'])
        if 'blood_group' in data:
            update_fields.append("blood_group = %s")
            params.append(data['blood_group'])
        if 'contact' in data:
            update_fields.append("phone = %s")
            params.append(data['contact'])
        if 'address' in data:
            update_fields.append("address = %s")
            params.append(data['address'])
        if 'email' in data:
            update_fields.append("email = %s")
            params.append(data['email'])
        if 'city' in data:
            update_fields.append("city = %s")
            params.append(data['city'])
        if 'is_active' in data:
            update_fields.append("is_active = %s")
            params.append(1 if data['is_active'] else 0)
        
        if not update_fields:
            return jsonify({"error": "No fields to update"}), 400
        
        params.append(donor_id)
        query = f"UPDATE donor SET {', '.join(update_fields)} WHERE donor_id = %s"
        cur.execute(query, tuple(params))
        mysql.connection.commit()
        
        if cur.rowcount == 0:
            cur.close()
            return jsonify({"error": "Donor not found"}), 404
        
        cur.close()
        return jsonify({"message": "Donor updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/donors/<int:donor_id>", methods=['DELETE'])
def delete_donor(donor_id):
    try:
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM donor WHERE donor_id = %s", (donor_id,))
        mysql.connection.commit()
        
        if cur.rowcount == 0:
            cur.close()
            return jsonify({"error": "Donor not found"}), 404
        
        cur.close()
        return jsonify({"message": "Donor deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== DONOR HEALTH ====================
@app.route("/donor_health", methods=['POST'])
def add_donor_health():
    try:
        data = request.json
        donor_id = data['donor_id']
        screening_date = data.get('screening_date', date.today().isoformat())
        bp = data.get('bp')
        weight = data.get('weight')
        disease_detected = data.get('disease_detected')
        eligibility_status = data['eligibility_status']

        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO donor_health (donor_id, screening_date, bp, weight, disease_detected, eligibility_status) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (donor_id, screening_date, bp, weight, disease_detected, eligibility_status),
        )
        mysql.connection.commit()
        health_id = cur.lastrowid
        cur.close()
        return jsonify({"message": "Donor health recorded", "health_id": health_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/donor_health/<int:donor_id>", methods=['GET'])
def get_donor_health(donor_id):
    try:
        cur = mysql.connection.cursor(DictCursor)
        cur.execute(
            "SELECT * FROM donor_health WHERE donor_id = %s ORDER BY screening_date DESC",
            (donor_id,)
        )
        health_records = cur.fetchall()
        cur.close()
        return jsonify(health_records)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== DONATIONS ====================
@app.route("/donations", methods=['POST'])
def add_donation():
    try:
        data = request.json
        donor_id = data['donor_id']
        bank_id = data['bank_id']
        screening_id = data.get('screening_id')  # Optional now
        donation_date = data.get('donation_date', date.today().isoformat())
        component_type = data['component_type']
        quantity_units = int(data['quantity_units'])
        expiry_date = data['expiry_date']

        cur = mysql.connection.cursor()
        
        # If screening_id is empty or None, insert NULL
        if not screening_id or screening_id == '':
            screening_id = None
        
        cur.execute(
            "INSERT INTO donation (donor_id, bank_id, screening_id, donation_date, component_type, quantity_units, expiry_date) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (donor_id, bank_id, screening_id, donation_date, component_type, quantity_units, expiry_date),
        )
        mysql.connection.commit()
        donation_id = cur.lastrowid
        cur.close()
        return jsonify({"message": "Donation recorded", "donation_id": donation_id}), 201
    except Exception as e:
        print(f"ERROR in add_donation: {str(e)}")
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

@app.route("/donations", methods=['GET'])
def get_donations():
    try:
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("""
            SELECT d.*, don.name as donor_name, b.bank_name 
            FROM donation d 
            JOIN donor don ON d.donor_id = don.donor_id 
            JOIN blood_bank b ON d.bank_id = b.bank_id 
            ORDER BY d.donation_date DESC
        """)
        donations = cur.fetchall()
        cur.close()
        return jsonify(donations)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== BLOOD STOCK ====================
@app.route("/stock", methods=['GET'])
def get_stock():
    try:
        cur = mysql.connection.cursor(DictCursor)
        
        blood_group = request.args.get('blood_group')
        bank_id = request.args.get('bank_id')
        
        query = """
            SELECT s.stock_id, s.bank_id, b.bank_name, b.location, s.blood_group, s.quantity_units, s.status 
            FROM blood_stock s JOIN blood_bank b ON s.bank_id = b.bank_id
            WHERE 1=1
        """
        params = []
        
        if blood_group:
            query += " AND s.blood_group = %s"
            params.append(blood_group)
        if bank_id:
            query += " AND s.bank_id = %s"
            params.append(bank_id)
        
        cur.execute(query, tuple(params))
        stock = cur.fetchall()
        cur.close()
        return jsonify(stock)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== HOSPITALS ====================
@app.route("/hospitals", methods=['GET'])
def get_hospitals():
    try:
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("SELECT hospital_id, hospital_name, location FROM hospital")
        hospitals = cur.fetchall()
        cur.close()
        return jsonify(hospitals)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/hospitals", methods=['POST'])
def add_hospital():
    try:
        data = request.json
        hospital_name = data['hospital_name']
        location = data['location']
        
        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO hospital (hospital_name, location) VALUES (%s, %s)",
            (hospital_name, location)
        )
        mysql.connection.commit()
        hospital_id = cur.lastrowid
        cur.close()
        return jsonify({"message": "Hospital added successfully", "hospital_id": hospital_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== BLOOD BANKS ====================
@app.route("/blood_banks", methods=['GET'])
def get_blood_banks():
    try:
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("SELECT bank_id, bank_name, location FROM blood_bank")
        banks = cur.fetchall()
        cur.close()
        return jsonify(banks)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/blood_banks", methods=['POST'])
def add_blood_bank():
    try:
        data = request.json
        bank_name = data['bank_name']
        location = data['location']
        
        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO blood_bank (bank_name, location) VALUES (%s, %s)",
            (bank_name, location)
        )
        mysql.connection.commit()
        bank_id = cur.lastrowid
        cur.close()
        return jsonify({"message": "Blood bank added successfully", "bank_id": bank_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== BLOOD REQUESTS ====================
@app.route("/requests", methods=['GET'])
def list_requests():
    try:
        cur = mysql.connection.cursor(DictCursor)
        
        status = request.args.get('status')
        blood_group = request.args.get('blood_group')
        
        query = """
            SELECT r.request_id, r.hospital_id, h.hospital_name, h.location, r.blood_group, r.component_type, 
            r.urgency_level, r.quantity_units, r.status, r.request_date 
            FROM blood_request r JOIN hospital h ON r.hospital_id = h.hospital_id
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND r.status = %s"
            params.append(status)
        if blood_group:
            query += " AND r.blood_group = %s"
            params.append(blood_group)
        
        query += " ORDER BY r.urgency_level DESC, r.request_date ASC"
        
        cur.execute(query, tuple(params))
        requests_data = cur.fetchall()
        cur.close()
        return jsonify(requests_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/requests", methods=['POST'])
def create_request():
    try:
        data = request.json
        hospital_id = data['hospital_id']
        blood_group = data['blood_group']
        component_type = data['component_type']
        urgency_level = data['urgency_level']
        quantity_units = int(data['quantity_units'])
        request_date = data.get('request_date', date.today().isoformat())

        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO blood_request (hospital_id, blood_group, component_type, urgency_level, quantity_units, request_date) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (hospital_id, blood_group, component_type, urgency_level, quantity_units, request_date),
        )
        mysql.connection.commit()
        request_id = cur.lastrowid
        cur.close()
        return jsonify({"message": "Blood request created", "request_id": request_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/requests/<int:request_id>", methods=['PUT'])
def update_request(request_id):
    try:
        data = request.json
        status = data.get('status')
        
        if not status:
            return jsonify({"error": "Status is required"}), 400
        
        cur = mysql.connection.cursor()
        cur.execute(
            "UPDATE blood_request SET status = %s WHERE request_id = %s",
            (status, request_id)
        )
        mysql.connection.commit()
        
        if cur.rowcount == 0:
            cur.close()
            return jsonify({"error": "Request not found"}), 404
        
        cur.close()
        return jsonify({"message": "Request updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/requests/<int:request_id>", methods=['DELETE'])
def delete_request(request_id):
    try:
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM blood_request WHERE request_id = %s", (request_id,))
        mysql.connection.commit()
        
        if cur.rowcount == 0:
            cur.close()
            return jsonify({"error": "Request not found"}), 404
        
        cur.close()
        return jsonify({"message": "Request deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== SEARCH ====================
@app.route("/search/donors", methods=['GET'])
def search_donors():
    try:
        search = request.args.get('q', '')
        cur = mysql.connection.cursor(DictCursor)
        cur.execute("""
            SELECT donor_id, name, age, gender, blood_group, phone, email, city 
            FROM donor 
            WHERE name LIKE %s OR email LIKE %s OR phone LIKE %s
            LIMIT 20
        """, (f"%{search}%", f"%{search}%", f"%{search}%"))
        results = cur.fetchall()
        cur.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
