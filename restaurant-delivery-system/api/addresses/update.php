<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

if (!isset($data['id'])) {
    sendErrorResponse(400, "Address ID is required.");
}

$db = (new Database())->getConnection();

if (isset($data['is_default']) && $data['is_default']) {
    $reset = $db->prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?");
    $reset->execute([$authUser['user_id']]);
}

$stmt = $db->prepare("UPDATE addresses SET 
    name = COALESCE(?, name), 
    phone = COALESCE(?, phone), 
    address = COALESCE(?, address), 
    landmark = COALESCE(?, landmark), 
    area = COALESCE(?, area), 
    city = COALESCE(?, city), 
    pincode = COALESCE(?, pincode), 
    latitude = COALESCE(?, latitude), 
    longitude = COALESCE(?, longitude), 
    is_default = COALESCE(?, is_default) 
    WHERE id = ? AND user_id = ?");
$stmt->execute([
    isset($data['name']) ? sanitizeInput($data['name']) : null,
    isset($data['phone']) ? sanitizeInput($data['phone']) : null,
    isset($data['address']) ? sanitizeInput($data['address']) : null,
    isset($data['landmark']) ? sanitizeInput($data['landmark']) : null,
    isset($data['area']) ? sanitizeInput($data['area']) : null,
    isset($data['city']) ? sanitizeInput($data['city']) : null,
    isset($data['pincode']) ? sanitizeInput($data['pincode']) : null,
    isset($data['latitude']) ? floatval($data['latitude']) : null,
    isset($data['longitude']) ? floatval($data['longitude']) : null,
    isset($data['is_default']) ? intval($data['is_default']) : null,
    $data['id'],
    $authUser['user_id']
]);

sendSuccessResponse(200, "Address updated successfully.");
