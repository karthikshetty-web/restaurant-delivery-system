<?php
// Application Constants & Environment Definitions

define('APP_NAME', 'Restaurant Delivery System');
define('APP_VERSION', '1.0.0');
define('BASE_URL', 'http://localhost/restaurant-delivery-system');

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'restaurant_delivery_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PASSWORD', ''); // Alias as requested
define('DB_PORT', '3306');

// JWT & Security Secret
define('SECRET_KEY', 'restaurant_delivery_system_super_secret_jwt_key_2026');

// User Roles
define('ROLE_CUSTOMER', 'customer');
define('ROLE_ADMIN', 'admin');
define('ROLE_KITCHEN', 'kitchen');
define('ROLE_DELIVERY', 'delivery_partner');

// Order Statuses
define('ORDER_STATUS_PENDING', 'pending');
define('ORDER_STATUS_CONFIRMED', 'confirmed');
define('ORDER_STATUS_PREPARING', 'preparing');
define('ORDER_STATUS_READY', 'ready');
define('ORDER_STATUS_OUT_FOR_DELIVERY', 'out_for_delivery');
define('ORDER_STATUS_DELIVERED', 'delivered');
define('ORDER_STATUS_CANCELLED', 'cancelled');

// Payment Statuses
define('PAYMENT_STATUS_PENDING', 'pending');
define('PAYMENT_STATUS_PAID', 'paid');
define('PAYMENT_STATUS_FAILED', 'failed');
define('PAYMENT_STATUS_REFUNDED', 'refunded');

// Payment Methods
define('PAYMENT_METHOD_COD', 'COD');
define('PAYMENT_METHOD_ONLINE', 'ONLINE');

// Delivery Statuses
define('DELIVERY_STATUS_ASSIGNED', 'assigned');
define('DELIVERY_STATUS_PICKED_UP', 'picked_up');
define('DELIVERY_STATUS_OUT_FOR_DELIVERY', 'out_for_delivery');
define('DELIVERY_STATUS_DELIVERED', 'delivered');

// Default Tax Rate
define('DEFAULT_TAX_PERCENTAGE', 5.00);
