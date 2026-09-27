<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authenticate();
$db = (new Database())->getConnection();

$stmt = $db->prepare("SELECT ci.id AS item_id, ci.food_id, f.name, f.image, f.is_available, ci.quantity, f.price AS unit_price, (ci.quantity * f.price) AS total_price 
    FROM cart c 
    JOIN cart_items ci ON c.id = ci.cart_id 
    JOIN food_items f ON ci.food_id = f.id 
    WHERE c.user_id = ?");
$stmt->execute([$authUser['user_id']]);
$items = $stmt->fetchAll();

$subtotal = 0.00;
foreach ($items as $item) {
    $subtotal += floatval($item['total_price']);
}

sendSuccessResponse(200, "Cart items retrieved.", [
    "items" => $items,
    "subtotal" => round($subtotal, 2)
]);
