<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

$id = isset($data['id']) ? intval($data['id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);
if (!$id) {
    sendErrorResponse(400, "Address ID is required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $authUser['user_id']]);

sendSuccessResponse(200, "Address deleted successfully.");
