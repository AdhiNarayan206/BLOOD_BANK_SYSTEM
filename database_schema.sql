-- Blood Bank Management System Database Schema
-- Run this script to create/update all tables

-- Create Database
CREATE DATABASE IF NOT EXISTS blood_bank_db;
USE blood_bank_db;

-- Table: BLOOD_BANK
CREATE TABLE IF NOT EXISTS blood_bank (
    bank_id INT PRIMARY KEY AUTO_INCREMENT,
    bank_name VARCHAR(100) NOT NULL,
    location VARCHAR(200)
);

-- Table: HOSPITAL
CREATE TABLE IF NOT EXISTS hospital (
    hospital_id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_name VARCHAR(100) NOT NULL,
    location VARCHAR(200)
);

-- Table: DONOR
CREATE TABLE IF NOT EXISTS donor (
    donor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    donor_type VARCHAR(20) DEFAULT 'Voluntary'
);

-- Table: DONOR_HEALTH
CREATE TABLE IF NOT EXISTS donor_health (
    health_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    screening_date DATE,
    bp VARCHAR(20),
    weight DECIMAL(5,2),
    disease_detected VARCHAR(255),
    eligibility_status ENUM('Eligible', 'Not Eligible') NOT NULL,
    FOREIGN KEY (donor_id) REFERENCES donor(donor_id) ON DELETE CASCADE
);

-- Table: DONATION
CREATE TABLE IF NOT EXISTS donation (
    donation_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    bank_id INT NOT NULL,
    screening_id INT NOT NULL,
    donation_date DATE NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    quantity_units INT NOT NULL,
    expiry_date DATE NOT NULL,
    FOREIGN KEY (donor_id) REFERENCES donor(donor_id),
    FOREIGN KEY (bank_id) REFERENCES blood_bank(bank_id),
    FOREIGN KEY (screening_id) REFERENCES donor_health(health_id)
);

-- Table: BLOOD_STOCK
CREATE TABLE IF NOT EXISTS blood_stock (
    stock_id INT PRIMARY KEY AUTO_INCREMENT,
    bank_id INT NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    quantity_units INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Available',
    FOREIGN KEY (bank_id) REFERENCES blood_bank(bank_id)
);

-- Table: BLOOD_REQUEST
CREATE TABLE IF NOT EXISTS blood_request (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    urgency_level ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    quantity_units INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    request_date DATE NOT NULL,
    FOREIGN KEY (hospital_id) REFERENCES hospital(hospital_id)
);

-- Insert sample blood banks
INSERT INTO blood_bank (bank_name, location) VALUES
('City Central Blood Bank', 'Downtown, Main Street'),
('Regional Blood Center', 'North District, Park Avenue'),
('Community Blood Bank', 'East Side, Medical Center')
ON DUPLICATE KEY UPDATE bank_name=bank_name;

-- Insert sample hospitals
INSERT INTO hospital (hospital_name, location) VALUES
('City General Hospital', 'Central District'),
('St. Mary Medical Center', 'West Side'),
('Regional Emergency Hospital', 'South District')
ON DUPLICATE KEY UPDATE hospital_name=hospital_name;

-- Insert sample blood stock (if not exists)
INSERT IGNORE INTO blood_stock (bank_id, blood_group, quantity_units, status) VALUES
(1, 'A+', 45, 'Available'),
(1, 'A-', 12, 'Available'),
(1, 'B+', 38, 'Available'),
(1, 'B-', 8, 'Low'),
(1, 'AB+', 15, 'Available'),
(1, 'AB-', 5, 'Low'),
(1, 'O+', 52, 'Available'),
(1, 'O-', 18, 'Available'),
(2, 'A+', 32, 'Available'),
(2, 'A-', 9, 'Low'),
(2, 'B+', 28, 'Available'),
(2, 'B-', 6, 'Low'),
(2, 'AB+', 11, 'Available'),
(2, 'AB-', 4, 'Low'),
(2, 'O+', 44, 'Available'),
(2, 'O-', 14, 'Available');

-- Create trigger to update stock after donation (optional)
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_donation_insert
AFTER INSERT ON donation
FOR EACH ROW
BEGIN
    -- Update or insert stock for the blood bank
    INSERT INTO blood_stock (bank_id, blood_group, quantity_units, status)
    SELECT 
        NEW.bank_id,
        d.blood_group,
        NEW.quantity_units,
        'Available'
    FROM donor d
    WHERE d.donor_id = NEW.donor_id
    ON DUPLICATE KEY UPDATE 
        quantity_units = quantity_units + NEW.quantity_units,
        status = CASE 
            WHEN quantity_units + NEW.quantity_units < 10 THEN 'Low'
            ELSE 'Available'
        END;
END//
DELIMITER ;

SELECT 'Database schema created/updated successfully!' as Status;
