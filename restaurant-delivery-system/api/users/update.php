<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();
$db = (new Database())->getConnection();

$targetId = ($authUser['role'] === ROLE_ADMIN && isset($data['id'])) ? intval($data['id']) : $authUser['user_id'];

$name = isset($data['name']) ? sanitizeInput($data['name']) : null;
$phone = isset($data['phone']) ? sanitizeInput($data['phone']) : null;
$avatar = isset($data['avatar']) ? sanitizeInput($data['avatar']) : null;
$password = isset($data['password']) && !empty($data['password']) ? password_hash($data['password'], PASSWORD_BCRYPT) : null;

$stmt = $db->prepare("UPDATE users SET 
    name = COALESCE(?, name), 
    phone = COALESCE(?, phone), 
    avatar = COALESCE(?, avatar),
    password = COALESCE(?, password)
    WHERE id = ?");
$stmt->execute([$name, $phone, $avatar, $password, $targetId]);

sendSuccessResponse(200, "User profile updated successfully.");
