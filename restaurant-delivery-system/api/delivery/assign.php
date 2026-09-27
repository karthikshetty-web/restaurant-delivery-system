<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authorizeAdmin();
$data = getJsonInput();

$missing = validateRequiredFields($data, ['order_id', 'delivery_partner_id']);
if (!empty($missing)) {
    sendErrorResponse(400, "Order ID and Delivery Partner ID are required.");
}

$db = (new Database())->getConnection();

// Verify delivery partner exists
$dpCheck = $db->prepare("SELECT id FROM delivery_partners WHERE id = ?");
$dpCheck->execute([$data['delivery_partner_id']]);
if (!$dpCheck->fetch()) {
    sendErrorResponse(404, "Delivery partner not found.");
}

$stmt = $db->prepare("INSERT INTO order_delivery (order_id, delivery_partner_id, status) VALUES (?, ?, 'assigned') 
    ON DUPLICATE KEY UPDATE delivery_partner_id = VALUES(delivery_partner_id), status = 'assigned'");
$stmt->execute([$data['order_id'], $data['delivery_partner_id']]);

sendSuccessResponse(200, "Delivery partner assigned successfully.");
