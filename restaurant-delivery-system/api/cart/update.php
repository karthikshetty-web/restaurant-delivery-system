<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

if (!isset($data['item_id']) || !isset($data['quantity'])) {
    sendErrorResponse(400, "Cart item ID and quantity are required.");
}

$itemId = intval($data['item_id']);
$quantity = intval($data['quantity']);

$db = (new Database())->getConnection();

$checkStmt = $db->prepare("SELECT ci.id FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE ci.id = ? AND c.user_id = ?");
$checkStmt->execute([$itemId, $authUser['user_id']]);
if (!$checkStmt->fetch()) {
    sendErrorResponse(404, "Cart item not found or unauthorized.");
}

if ($quantity <= 0) {
    $delStmt = $db->prepare("DELETE FROM cart_items WHERE id = ?");
    $delStmt->execute([$itemId]);
} else {
    $upStmt = $db->prepare("UPDATE cart_items SET quantity = ? WHERE id = ?");
    $upStmt->execute([$quantity, $itemId]);
}

sendSuccessResponse(200, "Cart updated successfully.");
