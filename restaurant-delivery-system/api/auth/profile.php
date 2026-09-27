<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authenticate();
$db = (new Database())->getConnection();

$stmt = $db->prepare("SELECT id, name, email, phone, role, avatar, status, created_at FROM users WHERE id = ?");
$stmt->execute([$authUser['user_id']]);
$user = $stmt->fetch();

if (!$user) {
    sendErrorResponse(404, "User profile not found.");
}

sendSuccessResponse(200, "User profile retrieved.", $user);
