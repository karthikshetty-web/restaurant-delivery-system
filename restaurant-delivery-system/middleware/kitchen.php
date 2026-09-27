<?php
require_once __DIR__ . '/auth.php';

function authorizeKitchen() {
    $user = authenticate();
    if (!in_array($user['role'], [ROLE_KITCHEN, ROLE_ADMIN])) {
        sendErrorResponse(403, "Forbidden. Kitchen staff access required.");
    }
    return $user;
}
