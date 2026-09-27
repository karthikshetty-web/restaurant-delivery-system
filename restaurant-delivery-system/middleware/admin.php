<?php
require_once __DIR__ . '/auth.php';

function authorizeAdmin() {
    $user = authenticate();
    if ($user['role'] !== ROLE_ADMIN) {
        sendErrorResponse(403, "Forbidden. Admin access required.");
    }
    return $user;
}
