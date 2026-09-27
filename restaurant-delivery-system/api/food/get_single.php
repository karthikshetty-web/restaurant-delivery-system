<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) {
    sendErrorResponse(400, "Food ID is required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("SELECT f.*, c.name AS category_name FROM food_items f JOIN categories c ON f.category_id = c.id WHERE f.id = ?");
$stmt->execute([$id]);
$food = $stmt->fetch();

if (!$food) {
    sendErrorResponse(404, "Food item not found.");
}

sendSuccessResponse(200, "Food item retrieved.", $food);
