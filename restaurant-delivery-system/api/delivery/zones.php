<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';

$db = (new Database())->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $authUser = authorizeAdmin();
    $data = getJsonInput();
    $missing = validateRequiredFields($data, ['zone_name', 'min_distance', 'max_distance', 'delivery_charge']);
    if (!empty($missing)) {
        sendErrorResponse(400, "Missing zone fields.", ["missing_fields" => $missing]);
    }
    $stmt = $db->prepare("INSERT INTO delivery_zones (zone_name, min_distance, max_distance, delivery_charge, min_order_amount) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        sanitizeInput($data['zone_name']),
        floatval($data['min_distance']),
        floatval($data['max_distance']),
        floatval($data['delivery_charge']),
        isset($data['min_order_amount']) ? floatval($data['min_order_amount']) : 0.00
    ]);
    sendSuccessResponse(201, "Delivery zone created.", ["id" => $db->lastInsertId()]);
} else {
    $stmt = $db->query("SELECT * FROM delivery_zones WHERE status = 'active' ORDER BY min_distance ASC");
    sendSuccessResponse(200, "Delivery zones list.", $stmt->fetchAll());
}
