<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authorizeAdmin();
$data = getJsonInput();

$missing = validateRequiredFields($data, ['code', 'discount_type', 'discount_amount', 'start_date', 'expiry_date']);
if (!empty($missing)) {
    sendErrorResponse(400, "Missing required coupon fields.", ["missing_fields" => $missing]);
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("INSERT INTO coupons (code, discount_type, discount_amount, min_order_amount, max_discount, start_date, expiry_date, usage_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->execute([
    strtoupper(sanitizeInput($data['code'])),
    $data['discount_type'],
    floatval($data['discount_amount']),
    isset($data['min_order_amount']) ? floatval($data['min_order_amount']) : 0.00,
    isset($data['max_discount']) ? floatval($data['max_discount']) : null,
    $data['start_date'],
    $data['expiry_date'],
    isset($data['usage_limit']) ? intval($data['usage_limit']) : 100
]);

sendSuccessResponse(201, "Coupon created successfully.", ["id" => $db->lastInsertId()]);
