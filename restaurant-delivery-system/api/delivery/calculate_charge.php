<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/delivery_helper.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';

$data = getJsonInput();
$distanceKm = isset($data['distance_km']) ? floatval($data['distance_km']) : (isset($_GET['distance_km']) ? floatval($_GET['distance_km']) : 1.0);

$db = (new Database())->getConnection();
$charge = calculateDeliveryChargeByDistance($distanceKm, $db);

sendSuccessResponse(200, "Delivery charge calculated.", [
    "distance_km" => $distanceKm,
    "delivery_charge" => $charge
]);
