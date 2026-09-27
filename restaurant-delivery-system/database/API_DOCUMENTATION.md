# Restaurant Delivery System - API Documentation

## Overview
Base URL: `http://localhost/restaurant-delivery-system`  
Content-Type: `application/json`

All authenticated requests require the header:
`Authorization: Bearer <your_jwt_token>`

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

---

## Endpoint Reference

### 1. Authentication
- **POST** `/api/auth/register.php`
  - Body: `{"name": "John Doe", "email": "john@example.com", "phone": "1234567890", "password": "Password123"}`
- **POST** `/api/auth/login.php`
  - Body: `{"email": "john@example.com", "password": "Password123"}`
- **POST** `/api/auth/logout.php`
- **GET** `/api/auth/profile.php` (Auth required)

### 2. Food & Categories
- **GET** `/api/categories/get.php`
- **POST** `/api/categories/add.php` (Admin required)
- **POST** `/api/categories/update.php` (Admin required)
- **POST** `/api/categories/delete.php` (Admin required)
- **GET** `/api/food/get.php?category_id=1&search=pizza`
- **GET** `/api/food/get_single.php?id=1`
- **POST** `/api/food/add.php` (Admin required)
- **POST** `/api/food/update.php` (Admin required)
- **POST** `/api/food/delete.php` (Admin required)
- **POST** `/api/food/availability.php` (Kitchen/Admin required)

### 3. Cart Management
- **POST** `/api/cart/add.php` (Auth required)
  - Body: `{"food_id": 1, "quantity": 2}`
- **GET** `/api/cart/get.php` (Auth required)
- **POST** `/api/cart/update.php` (Auth required)
  - Body: `{"item_id": 1, "quantity": 3}`
- **POST** `/api/cart/remove.php` (Auth required)
- **POST** `/api/cart/clear.php` (Auth required)

### 4. Addresses
- **POST** `/api/addresses/add.php` (Auth required)
- **GET** `/api/addresses/get.php` (Auth required)
- **POST** `/api/addresses/update.php` (Auth required)
- **POST** `/api/addresses/delete.php` (Auth required)

### 5. Orders & Transactions
- **POST** `/api/orders/create.php` (Auth required)
  - Body: `{"address_id": 1, "coupon_code": "WELCOME10", "payment_method": "COD", "distance_km": 2.5}`
- **GET** `/api/orders/get.php` (Auth required)
- **GET** `/api/orders/get_single.php?id=1` (Auth required)
- **POST** `/api/orders/update_status.php` (Auth/Admin/Kitchen/Rider)
- **POST** `/api/orders/cancel.php` (Auth required)
- **GET** `/api/orders/history.php` (Auth required)

### 6. Delivery Logistics
- **GET** `/api/delivery/zones.php`
- **POST** `/api/delivery/calculate_charge.php`
- **POST** `/api/delivery/assign.php` (Admin required)
- **GET** `/api/delivery/my_orders.php` (Rider required)
- **POST** `/api/delivery/update_status.php` (Rider required)

### 7. Coupons & Payments
- **GET** `/api/coupons/get.php`
- **POST** `/api/coupons/validate.php`
  - Body: `{"code": "WELCOME10", "subtotal": 25.00}`
- **POST** `/api/payments/create.php` (Auth required)
- **POST** `/api/payments/verify.php` (Auth required)

### 8. Reviews
- **POST** `/api/reviews/add.php` (Auth required, completed orders only)
- **GET** `/api/reviews/get.php?food_id=1`

### 9. Analytics & Admin
- **GET** `/api/analytics/dashboard.php` (Admin required)
- **GET** `/api/analytics/sales.php` (Admin required)
- **GET** `/api/analytics/popular_food.php` (Admin required)
