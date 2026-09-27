<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$db = (new Database())->getConnection();

$categoryId = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

$query = "SELECT f.*, c.name AS category_name FROM food_items f JOIN categories c ON f.category_id = c.id WHERE f.is_available = 1";
$params = [];

if ($categoryId > 0) {
    $query .= " AND f.category_id = ?";
    $params[] = $categoryId;
}

if (!empty($search)) {
    $query .= " AND (f.name LIKE ? OR f.description LIKE ?)";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
}

$query .= " ORDER BY f.id DESC";

$stmt = $db->prepare($query);
$stmt->execute($params);
$items = $stmt->fetchAll();

sendSuccessResponse(200, "Food items retrieved.", $items);
