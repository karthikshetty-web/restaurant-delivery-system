<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/admin.php';
require_once __DIR__ . '/../config/database.php';

$authUser = authorizeAdmin();
$db = (new Database())->getConnection();

$stmt = $db->query("SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY id DESC");
sendSuccessResponse(200, "Admin Users List", $stmt->fetchAll());
