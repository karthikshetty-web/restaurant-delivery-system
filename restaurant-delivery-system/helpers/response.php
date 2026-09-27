<?php

function sendResponse($statusCode, $success, $message, $data = null, $errors = []) {
    http_response_code($statusCode);
    header("Content-Type: application/json; charset=UTF-8");
    $response = [
        "success" => (bool)$success,
        "message" => $message
    ];
    if ($success) {
        $response["data"] = ($data !== null) ? $data : new stdClass();
    } else {
        $response["errors"] = is_array($errors) ? $errors : [$errors];
    }
    echo json_encode($response);
    exit();
}

function sendSuccessResponse($statusCode = 200, $message = "Operation successful", $data = []) {
    sendResponse($statusCode, true, $message, $data, []);
}

function sendErrorResponse($statusCode = 400, $message = "Something went wrong", $errors = []) {
    if (is_string($errors) && !empty($errors)) {
        $errors = [$errors];
    }
    sendResponse($statusCode, false, $message, null, $errors);
}
