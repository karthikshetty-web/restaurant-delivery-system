<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authenticate();
$db = (new Database())->getConnection();

$stmt = $db->prepare("SELECT * FROM orders WHERE user_id = ? AND order_status IN ('delivered', 'cancelled') ORDER BY id DESC");
$stmt->execute([$authUser['user_id']]);
$history = $stmt->fetchAll();

sendSuccessResponse(200, "Order history retrieved.", $history);
