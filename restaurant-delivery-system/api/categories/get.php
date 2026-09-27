<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$db = (new Database())->getConnection();
$stmt = $db->query("SELECT * FROM categories WHERE status = 'active' ORDER BY id ASC");
$categories = $stmt->fetchAll();

sendSuccessResponse(200, "Categories list retrieved.", $categories);
