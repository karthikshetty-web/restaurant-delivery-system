<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse(405, "Method not allowed. Use POST.");
}

$data = getJsonInput();
$missing = validateRequiredFields($data, ['email', 'password']);
if (!empty($missing)) {
    sendErrorResponse(400, "Email and password are required.", ["missing_fields" => $missing]);
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("SELECT id, name, email, phone, password, role, status FROM users WHERE email = ?");
$stmt->execute([$data['email']]);
$user = $stmt->fetch();

if (!$user || !password_verify($data['password'], $user['password'])) {
    sendErrorResponse(401, "Invalid email or password credentials.");
}

if ($user['status'] !== 'active') {
    sendErrorResponse(403, "Account is " . $user['status'] . ". Contact administrator.");
}

$token = generateToken($user['id'], $user['role']);

if (session_status() == PHP_SESSION_NONE) {
    @session_start();
}
$_SESSION['user_id'] = $user['id'];
$_SESSION['role'] = $user['role'];

sendSuccessResponse(200, "Login successful.", [
    "token" => $token,
    "user" => [
        "id" => $user['id'],
        "name" => $user['name'],
        "email" => $user['email'],
        "phone" => $user['phone'],
        "role" => $user['role']
    ]
]);
