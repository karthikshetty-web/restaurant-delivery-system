<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authenticate();
$orderId = isset($_GET['order_id']) ? intval($_GET['order_id']) : 0;
if (!$orderId) {
    sendErrorResponse(400, "Order ID is required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC");
$stmt->execute([$orderId]);
$payments = $stmt->fetchAll();

sendSuccessResponse(200, "Payment status retrieved.", $payments);
