from flask import Flask, jsonify,request
from flask_cors import CORS
from flask_mysqldb import MySQL

app = Flask(__name__)
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'A1d2h3i4*x'
app.config['MYSQL_DB'] = 'bloodbank'
mysql = MySQL(app)
CORS(app)


@app.route("/")
def index():
    cur=mysql.connection.cursor()
    cur.execute("SELECT * FROM donors")
    stock_data=cur.fetchall()
    cur.close()
    return jsonify(stock_data)



@app.route("/register_donor", methods=['POST'])
def register_donor():
    if request.method == 'POST':
        name=request.json['name'] #limit -100
        age=int(request.json['age'])
        gender=request.json['gender']#limit-10
        blood_group=request.json['blood_group']#limit-5
        contact=request.json['contact'] #limit-15
        address=request.json['address']#text?
        email=request.json['email']#limit-100

        cur = mysql.connection.cursor()
        cur.execute(
            "INSERT INTO donors (full_name, age, gender, blood_group, contact_no, address, email) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (name, age, gender, blood_group, contact, address, email)
        )
        mysql.connection.commit()
        cur.close()
        return jsonify({"message": "Donor registered"}), 201
    

if __name__ == "__main__":
    app.run(debug=True)
