<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

if (!isset($data['food_id'])) {
    sendErrorResponse(400, "Food ID is required.");
}

$foodId = intval($data['food_id']);
$quantity = isset($data['quantity']) ? max(1, intval($data['quantity'])) : 1;

$db = (new Database())->getConnection();

// 1. Get food price & availability from DB
$foodStmt = $db->prepare("SELECT price, is_available FROM food_items WHERE id = ?");
$foodStmt->execute([$foodId]);
$food = $foodStmt->fetch();

if (!$food) {
    sendErrorResponse(404, "Food item not found.");
}

if (!$food['is_available']) {
    sendErrorResponse(400, "Food item is currently unavailable.");
}

// 2. Get or create cart for user
$cartStmt = $db->prepare("SELECT id FROM cart WHERE user_id = ?");
$cartStmt->execute([$authUser['user_id']]);
$cart = $cartStmt->fetch();

if (!$cart) {
    $createCart = $db->prepare("INSERT INTO cart (user_id) VALUES (?)");
    $createCart->execute([$authUser['user_id']]);
    $cartId = $db->lastInsertId();
} else {
    $cartId = $cart['id'];
}

// 3. Add or update cart_items
$itemStmt = $db->prepare("SELECT id, quantity FROM cart_items WHERE cart_id = ? AND food_id = ?");
$itemStmt->execute([$cartId, $foodId]);
$existingItem = $itemStmt->fetch();

if ($existingItem) {
    $newQty = $existingItem['quantity'] + $quantity;
    $updateStmt = $db->prepare("UPDATE cart_items SET quantity = ?, price = ? WHERE id = ?");
    $updateStmt->execute([$newQty, $food['price'], $existingItem['id']]);
} else {
    $insertStmt = $db->prepare("INSERT INTO cart_items (cart_id, food_id, quantity, price) VALUES (?, ?, ?, ?)");
    $insertStmt->execute([$cartId, $foodId, $quantity, $food['price']]);
}

sendSuccessResponse(200, "Food item added to cart successfully.");
