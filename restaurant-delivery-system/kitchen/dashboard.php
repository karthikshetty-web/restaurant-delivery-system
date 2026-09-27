<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/kitchen.php';
require_once __DIR__ . '/../config/database.php';

$authUser = authorizeKitchen();
$db = (new Database())->getConnection();

$stmt = $db->query("SELECT o.id, o.order_number, o.order_status, o.created_at, COUNT(oi.id) AS item_count 
    FROM orders o 
    JOIN order_items oi ON o.id = oi.order_id 
    WHERE o.order_status IN ('confirmed', 'preparing') 
    GROUP BY o.id 
    ORDER BY o.created_at ASC");
$activeTickets = $stmt->fetchAll();

sendSuccessResponse(200, "Kitchen Display Dashboard Active Tickets", $activeTickets);
