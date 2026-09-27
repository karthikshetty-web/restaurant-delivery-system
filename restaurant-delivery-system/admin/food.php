<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/admin.php';
require_once __DIR__ . '/../config/database.php';

$authUser = authorizeAdmin();
$db = (new Database())->getConnection();

$stmt = $db->query("SELECT f.*, c.name AS category_name FROM food_items f JOIN categories c ON f.category_id = c.id ORDER BY f.id DESC");
sendSuccessResponse(200, "Admin Food Catalog", $stmt->fetchAll());
