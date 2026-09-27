<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/delivery.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/validation.php';

$authUser = authorizeDelivery();
$data = getJsonInput();

if (!isset($data['order_id']) || !isset($data['status'])) {
    sendErrorResponse(400, "Order ID and status are required.");
}

$status = strtolower(trim($data['status']));
$allowed = ['assigned', 'picked_up', 'out_for_delivery', 'delivered'];
if (!in_array($status, $allowed)) {
    sendErrorResponse(400, "Invalid delivery status.");
}

$db = (new Database())->getConnection();

$updateStmt = $db->prepare("UPDATE order_delivery SET 
    status = ?, 
    picked_up_at = IF(? = 'picked_up', CURRENT_TIMESTAMP, picked_up_at),
    delivered_at = IF(? = 'delivered', CURRENT_TIMESTAMP, delivered_at)
    WHERE order_id = ?");
$updateStmt->execute([$status, $status, $status, $data['order_id']]);

$orderStatusMap = [
    'picked_up' => 'out_for_delivery',
    'out_for_delivery' => 'out_for_delivery',
    'delivered' => 'delivered'
];

if (isset($orderStatusMap[$status])) {
    $mainOrderUpdate = $db->prepare("UPDATE orders SET order_status = ? WHERE id = ?");
    $mainOrderUpdate->execute([$orderStatusMap[$status], $data['order_id']]);
}

sendSuccessResponse(200, "Delivery status updated to '" . $status . "'.");
