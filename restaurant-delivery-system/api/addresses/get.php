<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authenticate();
$db = (new Database())->getConnection();

$stmt = $db->prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC");
$stmt->execute([$authUser['user_id']]);
$addresses = $stmt->fetchAll();

sendSuccessResponse(200, "Addresses retrieved.", $addresses);
