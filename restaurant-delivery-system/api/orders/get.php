<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authenticate();
$db = (new Database())->getConnection();

if ($authUser['role'] === ROLE_ADMIN) {
    $stmt = $db->query("SELECT o.*, u.name AS customer_name, u.email AS customer_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.id DESC");
} else {
    $stmt = $db->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC");
    $stmt->execute([$authUser['user_id']]);
}

$orders = $stmt->fetchAll();
sendSuccessResponse(200, "Orders retrieved.", $orders);
