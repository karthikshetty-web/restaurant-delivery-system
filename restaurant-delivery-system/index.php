<?php
// Restaurant Delivery System API Entry Point
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config/constants.php';
require_once __DIR__ . '/helpers/response.php';

sendSuccessResponse(200, "Welcome to the Restaurant Delivery System API", [
    "app_name" => APP_NAME,
    "version" => APP_VERSION,
    "endpoints" => [
        "auth" => "/api/auth/",
        "food" => "/api/food/",
        "categories" => "/api/categories/",
        "cart" => "/api/cart/",
        "orders" => "/api/orders/",
        "delivery" => "/api/delivery/",
        "coupons" => "/api/coupons/",
        "reviews" => "/api/reviews/",
        "admin" => "/admin/",
        "kitchen" => "/kitchen/",
        "delivery_partner" => "/delivery_partner/"
    ]
]);
