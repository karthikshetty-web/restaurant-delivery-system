<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authorizeAdmin();
$data = getJsonInput();

$id = isset($data['id']) ? intval($data['id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);
if (!$id) {
    sendErrorResponse(400, "Food ID is required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("DELETE FROM food_items WHERE id = ?");
$stmt->execute([$id]);

sendSuccessResponse(200, "Food item deleted successfully.");
