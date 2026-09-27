<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../middleware/admin.php';
require_once __DIR__ . '/../config/database.php';

$authUser = authorizeAdmin();
$db = (new Database())->getConnection();

$zones = $db->query("SELECT * FROM delivery_zones ORDER BY id DESC")->fetchAll();
$partners = $db->query("SELECT dp.*, u.name, u.phone FROM delivery_partners dp JOIN users u ON dp.user_id = u.id")->fetchAll();

sendSuccessResponse(200, "Admin Delivery Logistics", ["zones" => $zones, "partners" => $partners]);
