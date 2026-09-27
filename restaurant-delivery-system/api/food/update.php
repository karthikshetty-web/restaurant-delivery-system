<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authorizeAdmin();
$data = getJsonInput();

if (!isset($data['id'])) {
    sendErrorResponse(400, "Food ID is required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("UPDATE food_items SET 
    category_id = COALESCE(?, category_id), 
    name = COALESCE(?, name), 
    description = COALESCE(?, description), 
    price = COALESCE(?, price), 
    image = COALESCE(?, image), 
    is_available = COALESCE(?, is_available), 
    preparation_time = COALESCE(?, preparation_time) 
    WHERE id = ?");
$stmt->execute([
    isset($data['category_id']) ? intval($data['category_id']) : null,
    isset($data['name']) ? sanitizeInput($data['name']) : null,
    isset($data['description']) ? sanitizeInput($data['description']) : null,
    isset($data['price']) ? floatval($data['price']) : null,
    isset($data['image']) ? sanitizeInput($data['image']) : null,
    isset($data['is_available']) ? intval($data['is_available']) : null,
    isset($data['preparation_time']) ? intval($data['preparation_time']) : null,
    $data['id']
]);

sendSuccessResponse(200, "Food item updated successfully.");
