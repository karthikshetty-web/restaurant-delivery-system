<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../middleware/admin.php';
require_once __DIR__ . '/../../config/database.php';

$authUser = authorizeAdmin();
$db = (new Database())->getConnection();

$stmt = $db->query("SELECT f.id, f.name, f.price, c.name AS category_name, SUM(oi.quantity) as total_units_sold, SUM(oi.total_price) as total_revenue 
    FROM order_items oi 
    JOIN food_items f ON oi.food_id = f.id 
    JOIN categories c ON f.category_id = c.id 
    GROUP BY f.id 
    ORDER BY total_units_sold DESC 
    LIMIT 10");
$popular = $stmt->fetchAll();

sendSuccessResponse(200, "Popular food items analytics.", $popular);
