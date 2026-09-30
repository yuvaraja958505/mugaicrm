<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM business_domains ORDER BY name ASC");
    echo json_encode(['data' => $stmt->fetchAll()]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $name = trim($input['name'] ?? '');
    $description = trim($input['description'] ?? '');
    if (!$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Domain Name is required']);
        exit;
    }
    $stmt = $pdo->prepare("INSERT INTO business_domains (name, description) VALUES (?, ?)");
    $stmt->execute([$name, $description]);
    echo json_encode(['message' => 'Business Domain created', 'id' => (int)$pdo->lastInsertId()]);
    exit;
}

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Only Admin can modify or delete Business Domains']);
    exit;
}

if ($method === 'PUT') {
    $id = $input['id'] ?? null;
    $name = trim($input['name'] ?? '');
    $description = trim($input['description'] ?? '');
    $status = trim($input['status'] ?? 'active');
    if (!$id || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'ID and Name are required']);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE business_domains SET name = ?, description = ?, status = ? WHERE id = ?");
    $stmt->execute([$name, $description, $status, $id]);
    echo json_encode(['message' => 'Business Domain updated']);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM business_domains WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['message' => 'Business Domain deleted']);
    exit;
}
