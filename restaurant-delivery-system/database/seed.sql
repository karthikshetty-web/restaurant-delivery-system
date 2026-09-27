-- Realistic Seed Data for Restaurant Delivery System

USE `restaurant_delivery_db`;

-- Password hash for 'Password123'
-- $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

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
