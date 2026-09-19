-- Create Database
CREATE DATABASE IF NOT EXISTS food_hub;
USE food_hub;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer', 'cashier', 'admin') DEFAULT 'customer',
    phone VARCHAR(20),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- FoodItems Table
CREATE TABLE IF NOT EXISTS FoodItems (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    category ENUM('Starters', 'Main Course', 'Desserts', 'Beverages', 'Specials') NOT NULL,
    image VARCHAR(255) DEFAULT '/uploads/default-food.png',
    isAvailable TINYINT(1) DEFAULT 1,
    isPopular TINYINT(1) DEFAULT 0,
    preparationTime INTEGER,
    averageRating FLOAT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS Orders (
    id CHAR(36) PRIMARY KEY,
    orderNumber VARCHAR(255) UNIQUE,
    customerId CHAR(36),
    orderType ENUM('Takeaway', 'Dining') NOT NULL,
    tableNumber INTEGER,
    status ENUM('Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled') DEFAULT 'Pending',
    subtotal DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    totalAmount DECIMAL(10, 2),
    paymentMethod ENUM('Cash', 'Card', 'Visa'),
    paymentStatus ENUM('Pending', 'Paid') DEFAULT 'Pending',
    preparationTime INTEGER,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Users(id) ON DELETE SET NULL
);

-- OrderItems Table
CREATE TABLE IF NOT EXISTS OrderItems (
    id CHAR(36) PRIMARY KEY,
    orderId CHAR(36),
    foodItemId CHAR(36),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (foodItemId) REFERENCES FoodItems(id) ON DELETE CASCADE
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS Reviews (
    id CHAR(36) PRIMARY KEY,
    customerId CHAR(36),
    foodItemId CHAR(36),
    orderId CHAR(36),
    rating INTEGER NOT NULL,
    comment TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (foodItemId) REFERENCES FoodItems(id) ON DELETE CASCADE,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_food (customerId, foodItemId)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS Messages (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
