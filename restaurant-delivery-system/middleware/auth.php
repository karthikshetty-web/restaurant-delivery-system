<?php
require_once __DIR__ . '/../helpers/auth_helper.php';
require_once __DIR__ . '/../helpers/response.php';

function authenticate() {
    $user = getAuthUser();
    if (!$user) {
        sendErrorResponse(401, "Unauthorized access. Authentication token or session missing/invalid.");
    }
    return $user;
}
