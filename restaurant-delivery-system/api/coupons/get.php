<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$db = (new Database())->getConnection();
$stmt = $db->query("SELECT id, code, discount_type, discount_amount, min_order_amount, max_discount, start_date, expiry_date, usage_limit, used_count, status FROM coupons WHERE status = 'active' AND expiry_date >= CURDATE() ORDER BY id DESC");

sendSuccessResponse(200, "Active coupons retrieved.", $stmt->fetchAll());
