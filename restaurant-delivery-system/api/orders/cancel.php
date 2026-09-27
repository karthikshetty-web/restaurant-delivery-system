<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

$orderId = isset($data['order_id']) ? intval($data['order_id']) : (isset($_GET['order_id']) ? intval($_GET['order_id']) : 0);
if (!$orderId) {
    sendErrorResponse(400, "Order ID is required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("SELECT order_status FROM orders WHERE id = ? AND user_id = ?");
$stmt->execute([$orderId, $authUser['user_id']]);
$order = $stmt->fetch();

if (!$order) {
    sendErrorResponse(404, "Order not found.");
}

if ($order['order_status'] !== 'pending') {
    sendErrorResponse(400, "Cannot cancel order. Current status is '" . $order['order_status'] . "'.");
}

$cancel = $db->prepare("UPDATE orders SET order_status = 'cancelled' WHERE id = ?");
$cancel->execute([$orderId]);

sendSuccessResponse(200, "Order cancelled successfully.");
