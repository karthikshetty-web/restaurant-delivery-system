CREATE DATABASE IF NOT EXISTS `restaurant_delivery_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `restaurant_delivery_db`;

DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `order_delivery`;
DROP TABLE IF EXISTS `delivery_partners`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `delivery_zones`;
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `cart`;
DROP TABLE IF EXISTS `addresses`;
DROP TABLE IF EXISTS `food_items`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `restaurant_settings`;

CREATE TABLE `users` (
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

CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `food_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `image` VARCHAR(255) DEFAULT NULL,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `preparation_time` INT NOT NULL DEFAULT 20,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  INDEX `idx_food_category` (`category_id`),
  INDEX `idx_food_available` (`is_available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `addresses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
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

CREATE TABLE `cart` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `cart_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cart_id` INT NOT NULL,
  `food_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`cart_id`) REFERENCES `cart`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`food_id`) REFERENCES `food_items`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_cart_food` (`cart_id`, `food_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `delivery_zones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `zone_name` VARCHAR(100) NOT NULL,
  `min_distance` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `max_distance` DECIMAL(8,2) NOT NULL DEFAULT 10.00,
  `delivery_charge` DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  `min_order_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `coupons` (
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

CREATE TABLE `orders` (
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

CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `food_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`food_id`) REFERENCES `food_items`(`id`),
  INDEX `idx_order_items_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `delivery_partners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `vehicle_number` VARCHAR(50) DEFAULT NULL,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `order_delivery` (
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

CREATE TABLE `payments` (
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

CREATE TABLE `reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `food_id` INT NOT NULL,
  `order_id` INT NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`food_id`) REFERENCES `food_items`(`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  UNIQUE KEY `unique_user_order_food_review` (`user_id`, `order_id`, `food_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `restaurant_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `status`) VALUES
(1, 'System Admin', 'admin@restaurant.com', '9876543210', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active'),
(2, 'Head Chef Mario', 'kitchen@restaurant.com', '9876543211', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kitchen', 'active'),
(3, 'John Rider', 'delivery@restaurant.com', '9876543212', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'delivery_partner', 'active'),
(4, 'Sarah Customer', 'customer@example.com', '9876543213', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'active');

INSERT INTO `delivery_partners` (`id`, `user_id`, `vehicle_number`, `is_available`, `status`) VALUES
(1, 3, 'NY-RIDER-2026', 1, 'active');

INSERT INTO `categories` (`id`, `name`, `description`, `status`) VALUES
(1, 'Gourmet Pizzas', 'Hand-tossed Italian wood-fired pizzas', 'active'),
(2, 'Burgers & Sandwiches', 'Loaded artisan burgers and toasted wraps', 'active'),
(3, 'Pasta & Risotto', 'Authentic creamy pastas and risotto', 'active'),
(4, 'Beverages & Shakes', 'Refreshing cold juices, craft sodas & thick shakes', 'active'),
(5, 'Desserts & Bakes', 'Indulgent cakes, brownies and gelato', 'active');

INSERT INTO `food_items` (`id`, `category_id`, `name`, `description`, `price`, `is_available`, `preparation_time`) VALUES
(1, 1, 'Margherita Supreme', 'Fresh mozzarella, Italian basil, and crushed San Marzano tomatoes', 14.99, 1, 20),
(2, 1, 'Double Pepperoni Feast', 'Extra pepperoni, double mozzarella, and hot honey drizzle', 17.99, 1, 22),
(3, 2, 'Truffle Mushroom Burger', 'Angus beef patty, sauteed mushrooms, swiss cheese, truffle mayo', 12.99, 1, 15),
(4, 2, 'Crispy Veggie Crunch Burger', 'Plant-based patty, avocado, cheddar, signature herb dressing', 10.99, 1, 15),
(5, 3, 'Creamy Fettuccine Alfredo', 'Fettuccine tossed in parmesan cream sauce with garlic herbs', 13.50, 1, 18),
(6, 4, 'Alphonso Mango Smoothie', 'Fresh mangoes, Greek yogurt, and organic honey', 5.99, 1, 5),
(7, 5, 'Belgian Chocolate Molten Cake', 'Warm chocolate cake with a rich liquid truffle center', 6.99, 1, 12);

INSERT INTO `addresses` (`id`, `user_id`, `name`, `phone`, `address`, `landmark`, `area`, `city`, `pincode`, `latitude`, `longitude`, `is_default`) VALUES
(1, 4, 'Sarah Customer', '9876543213', 'Apt 4B, 123 Main Street', 'Near Central Park', 'Downtown', 'New York', '10001', 40.712776, -74.005974, 1);

INSERT INTO `delivery_zones` (`id`, `zone_name`, `min_distance`, `max_distance`, `delivery_charge`, `min_order_amount`, `status`) VALUES
(1, 'Inner City Zone', 0.00, 3.00, 3.50, 15.00, 'active'),
(2, 'Midtown Extension', 3.01, 7.00, 5.00, 20.00, 'active'),
(3, 'Outer Suburbs Zone', 7.01, 15.00, 8.50, 30.00, 'active');

INSERT INTO `coupons` (`id`, `code`, `discount_type`, `discount_amount`, `min_order_amount`, `max_discount`, `start_date`, `expiry_date`, `usage_limit`, `used_count`, `status`) VALUES
(1, 'WELCOME10', 'percentage', 10.00, 20.00, 15.00, '2026-01-01', '2026-12-31', 500, 5, 'active'),
(2, 'SAVER5', 'fixed', 5.00, 25.00, 5.00, '2026-01-01', '2026-12-31', 200, 12, 'active');

INSERT INTO `restaurant_settings` (`setting_key`, `setting_value`) VALUES
('restaurant_name', 'Gourmet Express Kitchen'),
('tax_percentage', '5.00'),
('currency_symbol', '$'),
('contact_phone', '+1 800 555 FOOD'),
('is_accepting_orders', '1');
