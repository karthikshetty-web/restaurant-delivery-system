<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authorizeAdmin();
$db = (new Database())->getConnection();

$statusStmt = $db->query("SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status");
$statusBreakdown = $statusStmt->fetchAll();

sendSuccessResponse(200, "Order analytics retrieved.", [
    "by_status" => $statusBreakdown
]);
