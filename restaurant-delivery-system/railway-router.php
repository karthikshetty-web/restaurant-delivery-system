
<?php

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Let existing files and directories load normally.
if ($path !== '/' && file_exists(__DIR__ . $path)) {
    return false;
}

// Use the HTML homepage for the root URL.
if ($path === '/') {
    readfile(__DIR__ . '/index.html');
    exit;
}

// Keep unknown routes from accidentally displaying the homepage.
http_response_code(404);
echo 'Not Found';
