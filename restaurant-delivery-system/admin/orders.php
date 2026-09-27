<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/admin.php';
require_once __DIR__ . '/../config/database.php';

$authUser = authorizeAdmin();
$db = (new Database())->getConnection();

$stmt = $db->query("SELECT o.*, u.name AS customer_name, a.city FROM orders o JOIN users u ON o.user_id = u.id JOIN addresses a ON o.address_id = a.id ORDER BY o.id DESC");
sendSuccessResponse(200, "Admin Orders List", $stmt->fetchAll());
