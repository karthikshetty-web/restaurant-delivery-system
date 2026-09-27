<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/kitchen.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authorizeKitchen();
$data = getJsonInput();

if (!isset($data['id']) || !isset($data['is_available'])) {
    sendErrorResponse(400, "Food ID and availability status are required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("UPDATE food_items SET is_available = ? WHERE id = ?");
$stmt->execute([intval($data['is_available']) ? 1 : 0, $data['id']]);

sendSuccessResponse(200, "Food availability updated successfully.");
