<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/kitchen.php';
require_once __DIR__ . '/../config/database.php';

$authUser = authorizeKitchen();
$db = (new Database())->getConnection();

$stmt = $db->query("SELECT o.id, o.order_number, o.order_status, o.special_instructions, o.created_at 
    FROM orders o 
    WHERE o.order_status IN ('confirmed', 'preparing', 'ready') 
    ORDER BY o.id ASC");
$orders = $stmt->fetchAll();

foreach ($orders as &$ord) {
    $itemStmt = $db->prepare("SELECT oi.quantity, f.name AS food_name FROM order_items oi JOIN food_items f ON oi.food_id = f.id WHERE oi.order_id = ?");
    $itemStmt->execute([$ord['id']]);
    $ord['items'] = $itemStmt->fetchAll();
}

sendSuccessResponse(200, "Kitchen Orders Queue", $orders);
