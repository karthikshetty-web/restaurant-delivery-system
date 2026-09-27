<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

$missing = validateRequiredFields($data, ['order_id', 'payment_method', 'amount']);
if (!empty($missing)) {
    sendErrorResponse(400, "Missing payment details.", ["missing_fields" => $missing]);
}

$txnId = 'TXN-' . date('YmdHis') . '-' . rand(1000, 9999);
$db = (new Database())->getConnection();

$stmt = $db->prepare("INSERT INTO payments (order_id, transaction_id, payment_method, amount, status) VALUES (?, ?, ?, ?, 'pending')");
$stmt->execute([$data['order_id'], $txnId, strtoupper($data['payment_method']), floatval($data['amount'])]);

sendSuccessResponse(201, "Payment record created.", [
    "payment_id" => $db->lastInsertId(),
    "transaction_id" => $txnId,
    "status" => "pending"
]);
