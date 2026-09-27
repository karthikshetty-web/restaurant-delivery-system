<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/validation.php';

$authUser = authenticate();
$data = getJsonInput();

if (!isset($data['transaction_id'])) {
    sendErrorResponse(400, "Transaction ID is required.");
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("SELECT * FROM payments WHERE transaction_id = ?");
$stmt->execute([$data['transaction_id']]);
$payment = $stmt->fetch();

if (!$payment) {
    sendErrorResponse(404, "Payment record not found.");
}

// Mark payment as paid
$update = $db->prepare("UPDATE payments SET status = 'paid' WHERE id = ?");
$update->execute([$payment['id']]);

$updateOrder = $db->prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?");
$updateOrder->execute([$payment['order_id']]);

sendSuccessResponse(200, "Payment verified successfully.", [
    "transaction_id" => $payment['transaction_id'],
    "status" => "paid"
]);
