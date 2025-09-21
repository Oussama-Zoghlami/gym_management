-- V13: Add pricing fields to gyms table

ALTER TABLE gyms 
ADD COLUMN monthly_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN annual_price DECIMAL(10,2) DEFAULT NULL;
