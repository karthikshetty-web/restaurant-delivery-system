<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authorizeAdmin();
$db = (new Database())->getConnection();

$totalOrders = $db->query("SELECT COUNT(*) FROM orders")->fetchColumn();
$todayOrders = $db->query("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()")->fetchColumn();
$totalRevenue = $db->query("SELECT COALESCE(SUM(final_amount), 0) FROM orders WHERE payment_status = 'paid'")->fetchColumn();
$todayRevenue = $db->query("SELECT COALESCE(SUM(final_amount), 0) FROM orders WHERE payment_status = 'paid' AND DATE(created_at) = CURDATE()")->fetchColumn();
$pendingOrders = $db->query("SELECT COUNT(*) FROM orders WHERE order_status = 'pending'")->fetchColumn();
$completedOrders = $db->query("SELECT COUNT(*) FROM orders WHERE order_status = 'delivered'")->fetchColumn();
$cancelledOrders = $db->query("SELECT COUNT(*) FROM orders WHERE order_status = 'cancelled'")->fetchColumn();

sendSuccessResponse(200, "Restaurant analytics dashboard overview.", [
    "total_orders" => intval($totalOrders),
    "today_orders" => intval($todayOrders),
    "total_revenue" => floatval($totalRevenue),
    "today_revenue" => floatval($todayRevenue),
    "pending_orders" => intval($pendingOrders),
    "completed_orders" => intval($completedOrders),
    "cancelled_orders" => intval($cancelledOrders)
]);
