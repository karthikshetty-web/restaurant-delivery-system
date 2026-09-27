<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/kitchen.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/validation.php';

$authUser = authorizeKitchen();
$data = getJsonInput();

if (!isset($data['order_id']) || !isset($data['order_status'])) {
    sendErrorResponse(400, "Order ID and status are required.");
}

$status = strtolower(trim($data['order_status']));
$allowed = ['confirmed', 'preparing', 'ready'];
if (!in_array($status, $allowed)) {
    sendErrorResponse(400, "Kitchen can only set status to 'confirmed', 'preparing', or 'ready'.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("UPDATE orders SET order_status = ? WHERE id = ?");
$stmt->execute([$status, $data['order_id']]);

sendSuccessResponse(200, "Kitchen updated order status to '" . $status . "'.");
