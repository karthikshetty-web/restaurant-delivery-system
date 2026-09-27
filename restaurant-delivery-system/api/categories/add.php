<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authorizeAdmin();
$data = getJsonInput();

$missing = validateRequiredFields($data, ['name']);
if (!empty($missing)) {
    sendErrorResponse(400, "Category name is required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("INSERT INTO categories (name, description, image, status) VALUES (?, ?, ?, ?)");
$stmt->execute([
    sanitizeInput($data['name']),
    isset($data['description']) ? sanitizeInput($data['description']) : null,
    isset($data['image']) ? sanitizeInput($data['image']) : null,
    isset($data['status']) ? $data['status'] : 'active'
]);

sendSuccessResponse(201, "Category added successfully.", ["id" => $db->lastInsertId()]);
