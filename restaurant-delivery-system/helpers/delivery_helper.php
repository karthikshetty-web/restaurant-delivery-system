<?php

function calculateDeliveryChargeByDistance($distanceKm, $db) {
    $stmt = $db->prepare("SELECT delivery_charge FROM delivery_zones WHERE min_distance <= ? AND max_distance >= ? AND status = 'active' LIMIT 1");
    $stmt->execute([$distanceKm, $distanceKm]);
    $zone = $stmt->fetch();

    if ($zone) {
        return floatval($zone['delivery_charge']);
    }

    if ($distanceKm <= 3) return 3.50;
    if ($distanceKm <= 7) return 5.00;
    return 8.50;
}
