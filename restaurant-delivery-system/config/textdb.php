<?php

require_once __DIR__ . '/database.php';

try {
    $db = Database::getInstance()->getConnection();

    echo "✅ Database connection successful!";
} catch (PDOException $e) {
    echo "❌ Database connection failed!";
    echo "<br>Error: " . $e->getMessage();
}