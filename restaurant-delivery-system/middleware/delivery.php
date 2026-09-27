<?php
require_once __DIR__ . '/auth.php';

function authorizeDelivery() {
    $user = authenticate();
    if (!in_array($user['role'], [ROLE_DELIVERY, ROLE_ADMIN])) {
        sendErrorResponse(403, "Forbidden. Delivery partner access required.");
    }
    return $user;
}
