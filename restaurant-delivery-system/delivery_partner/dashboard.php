<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/delivery.php';
require_once __DIR__ . '/../config/database.php';

$authUser = authorizeDelivery();
$db = (new Database())->getConnection();

$dpStmt = $db->prepare("SELECT id, is_available FROM delivery_partners WHERE user_id = ?");
$dpStmt->execute([$authUser['user_id']]);
$dp = $dpStmt->fetch();

$dpId = $dp ? $dp['id'] : 0;
$activeCount = $db->query("SELECT COUNT(*) FROM order_delivery WHERE delivery_partner_id = {$dpId} AND status IN ('assigned', 'picked_up', 'out_for_delivery')")->fetchColumn();
$completedCount = $db->query("SELECT COUNT(*) FROM order_delivery WHERE delivery_partner_id = {$dpId} AND status = 'delivered'")->fetchColumn();

sendSuccessResponse(200, "Rider Dashboard Overview", [
    "is_available" => $dp ? (bool)$dp['is_available'] : false,
    "active_deliveries" => intval($activeCount),
    "completed_deliveries" => intval($completedCount)
]);
