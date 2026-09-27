<?php
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../../helpers/response.php';

if (session_status() == PHP_SESSION_NONE) {
    @session_start();
}
session_unset();
session_destroy();

sendSuccessResponse(200, "Logout successful.");
