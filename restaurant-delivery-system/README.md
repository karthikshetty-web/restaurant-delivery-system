# Restaurant & Online Food Delivery System - PHP Backend

A complete, production-ready REST API backend for a Restaurant + Food Delivery platform built with pure PHP (PDO) and MySQL.

---

## Requirements
- **PHP**: Version 8.0 or higher
- **Database**: MySQL 5.7+ or MariaDB 10.3+
- **Environment**: XAMPP, WAMP, MAMP, or native Apache/Nginx web server

---

## Database Setup & XAMPP Installation

1. Start Apache & MySQL in XAMPP Control Panel.
2. Open phpMyAdmin at `http://localhost/phpmyadmin/`.
3. Create a new database named `restaurant_delivery_db`.
4. Import `database/schema.sql`.
5. Import `database/seed.sql`.

---

## Configuration

Modify database settings in `config/constants.php` if needed:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'restaurant_delivery_db');
define('DB_USER', 'root');
define('DB_PASS', '');
```

---

## Test Accounts

All pre-seeded test accounts use the password: `Password123`

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@restaurant.com` | `Password123` |
| **Kitchen Staff** | `kitchen@restaurant.com` | `Password123` |
| **Delivery Partner** | `delivery@restaurant.com` | `Password123` |
| **Customer** | `customer@example.com` | `Password123` |

---

## Feature Highlights
- **JWT Authentication & Role Middleware**: Customer, Admin, Kitchen, and Delivery Partner authorization.
- **Server-Side Calculations**: Subtotal, Coupon Discounts, Tax, and Delivery Charges calculated on the server.
- **Atomic Transactions**: Orders created inside PDO database transactions with automatic rollback on error.
- **Review System**: Strict verification ensuring only customers with delivered orders can review items.
- **Analytics & Reporting**: Sales breakdown, popular food analytics, and dashboard overview metrics.
