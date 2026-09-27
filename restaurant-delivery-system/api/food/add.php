<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authorizeAdmin();
$data = getJsonInput();

$missing = validateRequiredFields($data, ['name', 'category_id', 'price']);
if (!empty($missing)) {
    sendErrorResponse(400, "Missing required food fields.", ["missing_fields" => $missing]);
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("INSERT INTO food_items (category_id, name, description, price, image, is_available, preparation_time) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([
    intval($data['category_id']),
    sanitizeInput($data['name']),
    isset($data['description']) ? sanitizeInput($data['description']) : null,
    floatval($data['price']),
    isset($data['image']) ? sanitizeInput($data['image']) : null,
    isset($data['is_available']) ? intval($data['is_available']) : 1,
    isset($data['preparation_time']) ? intval($data['preparation_time']) : 20
]);

sendSuccessResponse(201, "Food item added successfully.", ["id" => $db->lastInsertId()]);
