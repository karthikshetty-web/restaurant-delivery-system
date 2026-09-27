<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$db = (new Database())->getConnection();
$foodId = isset($_GET['food_id']) ? intval($_GET['food_id']) : 0;

if ($foodId > 0) {
    $stmt = $db->prepare("SELECT r.*, u.name AS reviewer_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.food_id = ? ORDER BY r.id DESC");
    $stmt->execute([$foodId]);
} else {
    $stmt = $db->query("SELECT r.*, u.name AS reviewer_name, f.name AS food_name FROM reviews r JOIN users u ON r.user_id = u.id JOIN food_items f ON r.food_id = f.id ORDER BY r.id DESC");
}

sendSuccessResponse(200, "Reviews retrieved.", $stmt->fetchAll());
