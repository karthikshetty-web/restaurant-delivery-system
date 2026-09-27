<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

$missing = validateRequiredFields($data, ['food_id', 'order_id', 'rating']);
if (!empty($missing)) {
    sendErrorResponse(400, "Missing review fields.", ["missing_fields" => $missing]);
}

$rating = intval($data['rating']);
if ($rating < 1 || $rating > 5) {
    sendErrorResponse(400, "Rating must be between 1 and 5.");
}

$foodId = intval($data['food_id']);
$orderId = intval($data['order_id']);

$db = (new Database())->getConnection();

// 1. Verify order belongs to customer and is delivered
$orderStmt = $db->prepare("SELECT id FROM orders WHERE id = ? AND user_id = ? AND order_status = 'delivered'");
$orderStmt->execute([$orderId, $authUser['user_id']]);
if (!$orderStmt->fetch()) {
    sendErrorResponse(400, "Cannot review. You can only review food items from your completed/delivered orders.");
}

// 2. Verify food was ordered in that order
$itemStmt = $db->prepare("SELECT id FROM order_items WHERE order_id = ? AND food_id = ?");
$itemStmt->execute([$orderId, $foodId]);
if (!$itemStmt->fetch()) {
    sendErrorResponse(400, "Food item was not present in this order.");
}

// 3. Check duplicate review
$dupCheck = $db->prepare("SELECT id FROM reviews WHERE user_id = ? AND order_id = ? AND food_id = ?");
$dupCheck->execute([$authUser['user_id'], $orderId, $foodId]);
if ($dupCheck->fetch()) {
    sendErrorResponse(409, "You have already reviewed this item for this order.");
}

$stmt = $db->prepare("INSERT INTO reviews (user_id, food_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([
    $authUser['user_id'],
    $foodId,
    $orderId,
    $rating,
    isset($data['comment']) ? sanitizeInput($data['comment']) : null
]);

sendSuccessResponse(201, "Review submitted successfully.", ["id" => $db->lastInsertId()]);
