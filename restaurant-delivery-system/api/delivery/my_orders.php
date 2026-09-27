<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/delivery.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authorizeDelivery();
$db = (new Database())->getConnection();

// Get delivery partner ID for user
$dpStmt = $db->prepare("SELECT id FROM delivery_partners WHERE user_id = ?");
$dpStmt->execute([$authUser['user_id']]);
$dp = $dpStmt->fetch();

if (!$dp) {
    sendErrorResponse(404, "Delivery partner profile not found.");
}

$stmt = $db->prepare("SELECT od.id AS assignment_id, od.status AS delivery_status, od.assigned_at, o.id AS order_id, o.order_number, o.final_amount, o.order_status, a.name AS recipient_name, a.phone AS recipient_phone, a.address, a.area, a.city, a.pincode 
    FROM order_delivery od 
    JOIN orders o ON od.order_id = o.id 
    JOIN addresses a ON o.address_id = a.id 
    WHERE od.delivery_partner_id = ? 
    ORDER BY od.id DESC");
$stmt->execute([$dp['id']]);

sendSuccessResponse(200, "Assigned delivery orders.", $stmt->fetchAll());
