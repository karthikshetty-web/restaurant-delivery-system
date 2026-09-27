<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authorizeAdmin();
$db = (new Database())->getConnection();

// Daily sales (last 30 days)
$dailyStmt = $db->query("SELECT DATE(created_at) AS date, COUNT(id) AS total_orders, SUM(final_amount) AS total_revenue FROM orders WHERE payment_status = 'paid' GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30");
$dailySales = $dailyStmt->fetchAll();

// Monthly sales
$monthlyStmt = $db->query("SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(id) AS total_orders, SUM(final_amount) AS total_revenue FROM orders WHERE payment_status = 'paid' GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month DESC LIMIT 12");
$monthlySales = $monthlyStmt->fetchAll();

sendSuccessResponse(200, "Sales analytics retrieved.", [
    "daily_sales" => $dailySales,
    "monthly_sales" => $monthlySales
]);
