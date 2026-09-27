<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

$itemId = isset($data['item_id']) ? intval($data['item_id']) : (isset($_GET['item_id']) ? intval($_GET['item_id']) : 0);
if (!$itemId) {
    sendErrorResponse(400, "Cart item ID is required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("DELETE ci FROM cart_items ci JOIN cart c ON ci.cart_id = c.id WHERE ci.id = ? AND c.user_id = ?");
$stmt->execute([$itemId, $authUser['user_id']]);

sendSuccessResponse(200, "Item removed from cart.");
