<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authenticate();
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) {
    sendErrorResponse(400, "Order ID is required.");
}

$db = (new Database())->getConnection();

if ($authUser['role'] === ROLE_ADMIN) {
    $stmt = $db->prepare("SELECT o.*, a.name AS recipient_name, a.phone, a.address, a.area, a.city, a.pincode FROM orders o JOIN addresses a ON o.address_id = a.id WHERE o.id = ?");
    $stmt->execute([$id]);
} else {
    $stmt = $db->prepare("SELECT o.*, a.name AS recipient_name, a.phone, a.address, a.area, a.city, a.pincode FROM orders o JOIN addresses a ON o.address_id = a.id WHERE o.id = ? AND o.user_id = ?");
    $stmt->execute([$id, $authUser['user_id']]);
}

$order = $stmt->fetch();
if (!$order) {
    sendErrorResponse(404, "Order not found or access denied.");
}

// Fetch order items
$itemsStmt = $db->prepare("SELECT oi.*, f.name AS food_name, f.image FROM order_items oi JOIN food_items f ON oi.food_id = f.id WHERE oi.order_id = ?");
$itemsStmt->execute([$id]);
$order['items'] = $itemsStmt->fetchAll();

// Fetch payment info
$payStmt = $db->prepare("SELECT * FROM payments WHERE order_id = ?");
$payStmt->execute([$id]);
$order['payment'] = $payStmt->fetch();

// Fetch delivery assignment info
$delStmt = $db->prepare("SELECT od.*, u.name AS rider_name, u.phone AS rider_phone FROM order_delivery od JOIN delivery_partners dp ON od.delivery_partner_id = dp.id JOIN users u ON dp.user_id = u.id WHERE od.order_id = ?");
$delStmt->execute([$id]);
$order['delivery'] = $delStmt->fetch();

sendSuccessResponse(200, "Order details retrieved.", $order);
