<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM countries ORDER BY name ASC");
    echo json_encode(['data' => $stmt->fetchAll()]);
    exit;
}

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Only Admin can modify Countries']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $name = trim($input['name'] ?? '');
    $code = trim($input['code'] ?? '');
    if (!$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Country Name is required']);
        exit;
    }
    $stmt = $pdo->prepare("INSERT INTO countries (name, code) VALUES (?, ?)");
    $stmt->execute([$name, $code]);
    echo json_encode(['message' => 'Country created', 'id' => $pdo->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    $id = $input['id'] ?? null;
    $name = trim($input['name'] ?? '');
    $code = trim($input['code'] ?? '');
    $status = trim($input['status'] ?? 'active');
    if (!$id || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'ID and Name are required']);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE countries SET name = ?, code = ?, status = ? WHERE id = ?");
    $stmt->execute([$name, $code, $status, $id]);
    echo json_encode(['message' => 'Country updated']);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM countries WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['message' => 'Country deleted']);
    exit;
}
