<?php
require_once __DIR__ . '/constants.php';

class Database {
    private static $instance = null;
    private $conn;

    public function __construct() {
        $host = DB_HOST;
        $db   = DB_NAME;
        $user = DB_USER;
        $pass = DB_PASS;
        $port = DB_PORT;

        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $this->conn = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            header("Content-Type: application/json; charset=UTF-8");
            echo json_encode([
                "success" => false,
                "message" => "Database connection failed",
                "errors"  => [$e->getMessage()]
            ]);
            exit();
        }
    }

    public function getConnection() {
        return $this->conn;
    }

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
}
