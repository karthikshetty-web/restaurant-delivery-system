<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authorizeAdmin();
$data = getJsonInput();

if (!isset($data['id'])) {
    sendErrorResponse(400, "Category ID is required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("UPDATE categories SET 
    name = COALESCE(?, name), 
    description = COALESCE(?, description), 
    image = COALESCE(?, image), 
    status = COALESCE(?, status) 
    WHERE id = ?");
$stmt->execute([
    isset($data['name']) ? sanitizeInput($data['name']) : null,
    isset($data['description']) ? sanitizeInput($data['description']) : null,
    isset($data['image']) ? sanitizeInput($data['image']) : null,
    isset($data['status']) ? $data['status'] : null,
    $data['id']
]);

sendSuccessResponse(200, "Category updated successfully.");
