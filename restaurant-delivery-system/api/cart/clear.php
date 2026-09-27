<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authenticate();
$db = (new Database())->getConnection();

$stmt = $db->prepare("DELETE ci FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE c.user_id = ?");
$stmt->execute([$authUser['user_id']]);

sendSuccessResponse(200, "Cart cleared successfully.");
