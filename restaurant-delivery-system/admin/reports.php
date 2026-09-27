<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/admin.php';
require_once __DIR__ . '/../config/database.php';

$authUser = authorizeAdmin();
$db = (new Database())->getConnection();

$reports = [
    "total_revenue" => $db->query("SELECT COALESCE(SUM(final_amount),0) FROM orders WHERE payment_status = 'paid'")->fetchColumn(),
    "orders_count" => $db->query("SELECT COUNT(*) FROM orders")->fetchColumn(),
    "top_category" => $db->query("SELECT c.name FROM order_items oi JOIN food_items f ON oi.food_id = f.id JOIN categories c ON f.category_id = c.id GROUP BY c.id ORDER BY SUM(oi.quantity) DESC LIMIT 1")->fetchColumn()
];

sendSuccessResponse(200, "Admin Reports Data", $reports);
