
<?php
// Application Constants & Environment Definitions

define('APP_NAME', 'Restaurant Delivery System');
define('APP_VERSION', '1.0.0');

// Update this for your live Railway website
define('BASE_URL', 'https://restaurant-delivery-system-production.up.railway.app');

// Database Configuration
// Railway variables are used in production.
// Local defaults are retained for local development.

define('DB_HOST', getenv('MYSQLHOST') ?: 'localhost');
define('DB_NAME', getenv('MYSQLDATABASE') ?: 'restaurant_delivery_db');
define('DB_USER', getenv('MYSQLUSER') ?: 'root');
define('DB_PASS', getenv('MYSQLPASSWORD') ?: '');
define('DB_PASSWORD', DB_PASS);
define('DB_PORT', getenv('MYSQLPORT') ?: '3306');

// JWT & Security Secret
define(
    'SECRET_KEY',
    getenv('SECRET_KEY') ?: 'restaurant_delivery_system_super_secret_jwt_key_2026'
);

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
