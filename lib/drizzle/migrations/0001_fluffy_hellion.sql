-- --------------------------------------------------------
-- 1. CONFIGURATION: Prices & Payment Methods
-- --------------------------------------------------------

-- Store your dynamic prices here (e.g., VIP vs Regular, Student vs Adult)
CREATE TABLE `ticket_prices` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL,            -- e.g. "Early Bird Adult"
    `type` ENUM('ADULT', 'CHILD', 'STUDENT') NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,         -- e.g. 50000.00
    `description` VARCHAR(255),
    `is_active` BOOLEAN DEFAULT TRUE
);

-- Store payment methods (M-Pesa, Tigo, etc.) so you can toggle them ON/OFF
CREATE TABLE `payment_methods` (
    `id` VARCHAR(50) PRIMARY KEY,           -- e.g. "mpesa"
    `name` VARCHAR(100) NOT NULL,           -- e.g. "Vodacom M-Pesa"
    `image_url` VARCHAR(255) NOT NULL,
    `color_class` VARCHAR(100),             -- e.g. "border-red-500"
    `is_active` BOOLEAN DEFAULT TRUE
);

-- --------------------------------------------------------
-- 2. SCHEDULE: Days & Sessions
-- --------------------------------------------------------

-- The specific dates of your event
CREATE TABLE `event_days` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL,            -- e.g. "Day 1 - Opening"
    `date` DATE NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE
);

-- The specific time slots per day (e.g., Morning vs Evening)
CREATE TABLE `event_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `day_id` INT NOT NULL,
    `name` VARCHAR(50) NOT NULL,            -- e.g. "Gala Dinner"
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    
    FOREIGN KEY (`day_id`) REFERENCES `event_days`(`id`) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 3. THE MAIN ORDER: Tickets
-- --------------------------------------------------------

-- This is the "parent" record for a purchase. 
-- It links to a specific Session (Day+Time).
CREATE TABLE `tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `session_id` INT NOT NULL,              -- Valid ONLY for this session
    `ticket_code` VARCHAR(64) NOT NULL UNIQUE, -- Secure QR Code String
    
    -- Purchaser Contact Info
    `purchaser_name` VARCHAR(255) NOT NULL,
    `purchaser_phone` VARCHAR(20) NOT NULL,
    
    -- Financials
    `total_amount` DECIMAL(10,2) NOT NULL,
    `payment_status` VARCHAR(20) DEFAULT 'UNPAID', -- UNPAID, PAID, FAILED
    `payment_method_id` VARCHAR(50),        -- Which method they used
    
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`session_id`) REFERENCES `event_sessions`(`id`),
    FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`)
);

-- --------------------------------------------------------
-- 4. THE ATTENDEES (Separate Tables)
-- --------------------------------------------------------

-- Table for ADULTS (Needs Phone Number)
CREATE TABLE `attendees_adults` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    
    `full_name` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20) NOT NULL,
    
    -- Entry Logic
    `is_used` BOOLEAN DEFAULT FALSE,
    `scanned_at` TIMESTAMP NULL,

    FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE
);

-- Table for STUDENTS (Needs ID & School)
CREATE TABLE `attendees_students` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    
    `full_name` VARCHAR(255) NOT NULL,
    `student_id` VARCHAR(50) NOT NULL,
    `institution` VARCHAR(255) NOT NULL,    -- School/College Name
    
    -- Entry Logic
    `is_used` BOOLEAN DEFAULT FALSE,
    `scanned_at` TIMESTAMP NULL,

    FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE
);

-- Table for CHILDREN (Needs DOB or Age Verification)
CREATE TABLE `attendees_children` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    
    `full_name` VARCHAR(255) NOT NULL,
    `parent_name` VARCHAR(255),             -- Optional guardian reference
    `date_of_birth` DATE,                   -- To verify age < 15
    
    -- Entry Logic
    `is_used` BOOLEAN DEFAULT FALSE,
    `scanned_at` TIMESTAMP NULL,

    FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE
);