<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/order_helper.php';

$authUser = authenticate();
$data = getJsonInput();

if (!isset($data['order_id']) || !isset($data['order_status'])) {
    sendErrorResponse(400, "Order ID and status are required.");
}

$orderId = intval($data['order_id']);
$newStatus = strtolower(trim($data['order_status']));

$db = (new Database())->getConnection();

$stmt = $db->prepare("SELECT order_status FROM orders WHERE id = ?");
$stmt->execute([$orderId]);
$order = $stmt->fetch();

if (!$order) {
    sendErrorResponse(404, "Order not found.");
}

if (!isValidStatusTransition($order['order_status'], $newStatus)) {
    sendErrorResponse(400, "Invalid order status transition from '" . $order['order_status'] . "' to '" . $newStatus . "'.");
}

$updateStmt = $db->prepare("UPDATE orders SET order_status = ? WHERE id = ?");
$updateStmt->execute([$newStatus, $orderId]);

sendSuccessResponse(200, "Order status updated to '" . $newStatus . "'.");
