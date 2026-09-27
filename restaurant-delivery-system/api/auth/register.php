<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse(405, "Method not allowed. Use POST.");
}

$data = getJsonInput();
$missing = validateRequiredFields($data, ['name', 'email', 'phone', 'password']);
if (!empty($missing)) {
    sendErrorResponse(400, "Missing required registration fields.", ["missing_fields" => $missing]);
}

if (!validateEmail($data['email'])) {
    sendErrorResponse(400, "Invalid email address format.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$data['email']]);
if ($stmt->fetch()) {
    sendErrorResponse(409, "Email address is already registered.");
}

$hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
$role = isset($data['role']) && in_array($data['role'], ['customer', 'delivery_partner']) ? $data['role'] : ROLE_CUSTOMER;

$insert = $db->prepare("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)");
if ($insert->execute([sanitizeInput($data['name']), $data['email'], sanitizeInput($data['phone']), $hashedPassword, $role])) {
    $userId = $db->lastInsertId();

    if ($role === 'delivery_partner') {
        $dpStmt = $db->prepare("INSERT INTO delivery_partners (user_id, vehicle_number) VALUES (?, ?)");
        $dpStmt->execute([$userId, isset($data['vehicle_number']) ? sanitizeInput($data['vehicle_number']) : null]);
    }

    sendSuccessResponse(201, "User registered successfully.", [
        "user_id" => $userId,
        "name" => $data['name'],
        "email" => $data['email'],
        "role" => $role
    ]);
} else {
    sendErrorResponse(500, "Failed to complete registration.");
}
