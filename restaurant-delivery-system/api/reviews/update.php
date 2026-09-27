<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

if (!isset($data['id'])) {
    sendErrorResponse(400, "Review ID is required.");
}

$rating = isset($data['rating']) ? intval($data['rating']) : null;
if ($rating !== null && ($rating < 1 || $rating > 5)) {
    sendErrorResponse(400, "Rating must be between 1 and 5.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("UPDATE reviews SET rating = COALESCE(?, rating), comment = COALESCE(?, comment) WHERE id = ? AND user_id = ?");
$stmt->execute([
    $rating,
    isset($data['comment']) ? sanitizeInput($data['comment']) : null,
    $data['id'],
    $authUser['user_id']
]);

sendSuccessResponse(200, "Review updated successfully.");
