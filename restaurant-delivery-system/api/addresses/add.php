<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

$missing = validateRequiredFields($data, ['name', 'phone', 'address', 'area', 'city', 'pincode']);
if (!empty($missing)) {
    sendErrorResponse(400, "Missing address fields.", ["missing_fields" => $missing]);
}

$db = (new Database())->getConnection();

if (isset($data['is_default']) && $data['is_default']) {
    $reset = $db->prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?");
    $reset->execute([$authUser['user_id']]);
}

$stmt = $db->prepare("INSERT INTO addresses (user_id, name, phone, address, landmark, area, city, pincode, latitude, longitude, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([
    $authUser['user_id'],
    sanitizeInput($data['name']),
    sanitizeInput($data['phone']),
    sanitizeInput($data['address']),
    isset($data['landmark']) ? sanitizeInput($data['landmark']) : null,
    sanitizeInput($data['area']),
    sanitizeInput($data['city']),
    sanitizeInput($data['pincode']),
    isset($data['latitude']) ? floatval($data['latitude']) : null,
    isset($data['longitude']) ? floatval($data['longitude']) : null,
    isset($data['is_default']) ? (int)$data['is_default'] : 0
]);

sendSuccessResponse(201, "Address added successfully.", ["id" => $db->lastInsertId()]);
