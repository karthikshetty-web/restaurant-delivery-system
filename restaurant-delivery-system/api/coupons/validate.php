<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

$data = getJsonInput();
$missing = validateRequiredFields($data, ['code', 'subtotal']);
if (!empty($missing)) {
    sendErrorResponse(400, "Coupon code and subtotal are required.");
}

$code = strtoupper(trim($data['code']));
$subtotal = floatval($data['subtotal']);

$db = (new Database())->getConnection();
$stmt = $db->prepare("SELECT * FROM coupons WHERE code = ? AND status = 'active' AND start_date <= CURDATE() AND expiry_date >= CURDATE()");
$stmt->execute([$code]);
$coupon = $stmt->fetch();

if (!$coupon) {
    sendErrorResponse(404, "Invalid or expired coupon code.");
}

if ($subtotal < floatval($coupon['min_order_amount'])) {
    sendErrorResponse(400, "Minimum order amount of $" . number_format($coupon['min_order_amount'], 2) . " required for this coupon.");
}

if ($coupon['used_count'] >= $coupon['usage_limit']) {
    sendErrorResponse(400, "Coupon usage limit reached.");
}

$discount = ($coupon['discount_type'] === 'percentage') ? round(($subtotal * floatval($coupon['discount_amount'])) / 100, 2) : floatval($coupon['discount_amount']);
if (!empty($coupon['max_discount']) && $discount > floatval($coupon['max_discount'])) {
    $discount = floatval($coupon['max_discount']);
}

sendSuccessResponse(200, "Coupon is valid.", [
    "coupon_id" => $coupon['id'],
    "code" => $coupon['code'],
    "discount_type" => $coupon['discount_type'],
    "discount_amount" => $discount
]);
