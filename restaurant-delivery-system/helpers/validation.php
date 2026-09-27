<?php

function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)));
}

function validateRequiredFields($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string)$data[$field]) === '') {
            $missing[] = $field;
        }
    }
    return $missing;
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function getJsonInput() {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    if (is_array($data)) {
        return $data;
    }
    return $_POST;
}
