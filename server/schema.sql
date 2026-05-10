-- Database schema for Effort Tracker

-- Table for Users
CREATE TABLE IF NOT EXISTS et_users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('AD', 'MG', 'TL', 'US') NOT NULL,
    team VARCHAR(100),
    access_team VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Timesheets
CREATE TABLE IF NOT EXISTS et_timesheets (
    TS_TIMESHEET_ID INT AUTO_INCREMENT PRIMARY KEY,
    TS_USER_ID VARCHAR(50) NOT NULL,
    TS_DATE DATE NOT NULL,
    TS_WORKING_STATUS ENUM('Working', 'PTO') NOT NULL,
    TS_ROLE VARCHAR(50), -- DEV / QA
    TS_NAME VARCHAR(100),
    TS_JIRA_TICKET VARCHAR(50),
    TS_ACTIVITY VARCHAR(100),
    TS_EFFORT_HOURS DECIMAL(5, 2) DEFAULT 0,
    TS_TEAM VARCHAR(100),
    TS_COMMENTS TEXT,
    TS_CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (TS_USER_ID) REFERENCES et_users(user_id)
);

-- Activities table
CREATE TABLE IF NOT EXISTS et_activities (
    activity_id INT AUTO_INCREMENT PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL
);

-- Seed initial activities
INSERT INTO et_activities (activity_name) VALUES 
('adhoc activities'), ('analysis'), ('business connect'), 
('business walkthrough'), ('code promotion'), ('code review'), 
('coding'), ('design'), ('design review'), ('training'), ('unit testing');
