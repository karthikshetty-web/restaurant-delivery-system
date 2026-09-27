<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/admin.php';
require_once __DIR__ . '/../config/database.php';

$authUser = authorizeAdmin();
$db = (new Database())->getConnection();

$stats = [
    "total_users" => $db->query("SELECT COUNT(*) FROM users")->fetchColumn(),
    "total_food_items" => $db->query("SELECT COUNT(*) FROM food_items")->fetchColumn(),
    "total_orders" => $db->query("SELECT COUNT(*) FROM orders")->fetchColumn(),
    "total_revenue" => $db->query("SELECT COALESCE(SUM(final_amount),0) FROM orders WHERE payment_status = 'paid'")->fetchColumn()
];

sendSuccessResponse(200, "Admin Dashboard Overview", $stats);
