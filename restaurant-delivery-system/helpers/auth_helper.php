<?php
require_once __DIR__ . '/../config/constants.php';

function generateToken($userId, $role) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'user_id' => $userId,
        'role' => $role,
        'iat' => time(),
        'exp' => time() + (86400 * 7) // 7 days expiration
    ]);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, SECRET_KEY, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verifyToken($token) {
    $tokenParts = explode('.', $token);
    if (count($tokenParts) !== 3) return false;

    $header = $tokenParts[0];
    $payload = $tokenParts[1];
    $signatureProvided = $tokenParts[2];

    $signature = hash_hmac('sha256', $header . "." . $payload, SECRET_KEY, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    if ($base64UrlSignature !== $signatureProvided) return false;

    $decodedPayload = json_decode(base64_decode($payload), true);
    if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
        return false;
    }

    return $decodedPayload;
}

function getAuthUser() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = '';

    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (!empty($authHeader) && preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        return verifyToken($matches[1]);
    }

    if (session_status() == PHP_SESSION_NONE) {
        @session_start();
    }
    if (isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
        return [
            'user_id' => $_SESSION['user_id'],
            'role' => $_SESSION['role']
        ];
    }

    return null;
}
