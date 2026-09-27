<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/delivery.php';
require_once __DIR__ . '/../config/database.php';

$authUser = authorizeDelivery();
$db = (new Database())->getConnection();

$dpStmt = $db->prepare("SELECT id FROM delivery_partners WHERE user_id = ?");
$dpStmt->execute([$authUser['user_id']]);
$dp = $dpStmt->fetch();

$dpId = $dp ? $dp['id'] : 0;

$stmt = $db->prepare("SELECT od.id AS assignment_id, od.status AS delivery_status, o.id AS order_id, o.order_number, o.final_amount, a.name AS customer_name, a.phone AS customer_phone, a.address, a.area, a.city, a.pincode 
    FROM order_delivery od 
    JOIN orders o ON od.order_id = o.id 
    JOIN addresses a ON o.address_id = a.id 
    WHERE od.delivery_partner_id = ? 
    ORDER BY od.id DESC");
$stmt->execute([$dpId]);

sendSuccessResponse(200, "Delivery Partner Orders", $stmt->fetchAll());
