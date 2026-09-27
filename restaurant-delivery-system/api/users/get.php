<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authenticate();
$db = (new Database())->getConnection();

if ($authUser['role'] === ROLE_ADMIN) {
    $userId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($userId > 0) {
        $stmt = $db->prepare("SELECT id, name, email, phone, role, avatar, status, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $data = $stmt->fetch();
    } else {
        $stmt = $db->query("SELECT id, name, email, phone, role, avatar, status, created_at FROM users ORDER BY id DESC");
        $data = $stmt->fetchAll();
    }
    sendSuccessResponse(200, "User data retrieved.", $data);
} else {
    // Regular customer can only view own info
    $stmt = $db->prepare("SELECT id, name, email, phone, role, avatar, status, created_at FROM users WHERE id = ?");
    $stmt->execute([$authUser['user_id']]);
    sendSuccessResponse(200, "User profile retrieved.", $stmt->fetch());
}
