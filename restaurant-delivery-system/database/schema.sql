-- Restaurant Delivery System Database Schema

CREATE DATABASE IF NOT EXISTS `restaurant_delivery_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `restaurant_delivery_db`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'admin', 'kitchen', 'delivery_partner') NOT NULL DEFAULT 'customer',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Food Items Table
CREATE TABLE IF NOT EXISTS `food_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL CHECK (`price` >= 0),
  `image` VARCHAR(255) DEFAULT NULL,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `preparation_time` INT NOT NULL DEFAULT 20 COMMENT 'Time in minutes',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  INDEX `idx_food_category` (`category_id`),
  INDEX `idx_food_available` (`is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. User Addresses
CREATE TABLE IF NOT EXISTS `addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL COMMENT 'Recipient Name',
  `phone` VARCHAR(20) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `landmark` VARCHAR(150) DEFAULT NULL,
  `area` VARCHAR(150) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `pincode` VARCHAR(20) NOT NULL,
  `latitude` DECIMAL(10,8) DEFAULT NULL,
  `longitude` DECIMAL(11,8) DEFAULT NULL,
  `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_address_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Cart Table
CREATE TABLE IF NOT EXISTS `cart` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Cart Items Table
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cart_id` INT NOT NULL,
  `food_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1 CHECK (`quantity` > 0),
  `price` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`cart_id`) REFERENCES `cart`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`food_id`) REFERENCES `food_items`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_cart_food` (`cart_id`, `food_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Delivery Zones
CREATE TABLE IF NOT EXISTS `delivery_zones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `zone_name` VARCHAR(100) NOT NULL,
  `min_distance` DECIMAL(8,2) NOT NULL DEFAULT 0.00 COMMENT 'Distance in km',
  `max_distance` DECIMAL(8,2) NOT NULL DEFAULT 10.00 COMMENT 'Distance in km',
  `delivery_charge` DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  `min_order_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Coupons Table
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `discount_amount` DECIMAL(10,2) NOT NULL,
  `min_order_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `max_discount` DECIMAL(10,2) DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `usage_limit` INT NOT NULL DEFAULT 100,
  `used_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_coupon_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT NOT NULL,
  `address_id` INT NOT NULL,
  `coupon_id` INT DEFAULT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `delivery_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `final_amount` DECIMAL(10,2) NOT NULL,
  `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `order_status` ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  `special_instructions` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`),
  FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON DELETE SET NULL,
  INDEX `idx_order_user` (`user_id`),
  INDEX `idx_order_status` (`order_status`),
  INDEX `idx_order_number` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Order Items Table
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `food_id` INT NOT NULL,
  `quantity` INT NOT NULL CHECK (`quantity` > 0),
  `unit_price` DECIMAL(10,2) NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`food_id`) REFERENCES `food_items`(`id`),
  INDEX `idx_order_items_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Delivery Partners Table
CREATE TABLE IF NOT EXISTS `delivery_partners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `vehicle_number` VARCHAR(50) DEFAULT NULL,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Order Delivery Assignments Table
CREATE TABLE IF NOT EXISTS `order_delivery` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL UNIQUE,
  `delivery_partner_id` INT NOT NULL,
  `status` ENUM('assigned', 'picked_up', 'out_for_delivery', 'delivered') NOT NULL DEFAULT 'assigned',
  `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `picked_up_at` TIMESTAMP NULL DEFAULT NULL,
  `delivered_at` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`delivery_partner_id`) REFERENCES `delivery_partners`(`id`),
  INDEX `idx_delivery_partner` (`delivery_partner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Payments Table
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `transaction_id` VARCHAR(100) NOT NULL UNIQUE,
  `payment_method` ENUM('COD', 'ONLINE') NOT NULL DEFAULT 'COD',
  `amount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `gateway_response` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  INDEX `idx_payment_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Reviews Table
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `food_id` INT NOT NULL,
  `order_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`food_id`) REFERENCES `food_items`(`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  UNIQUE KEY `unique_user_order_food_review` (`user_id`, `order_id`, `food_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Restaurant Settings Table
CREATE TABLE IF NOT EXISTS `restaurant_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
