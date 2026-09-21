<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $state_id = $_GET['state_id'] ?? null;
    if ($state_id) {
        $stmt = $pdo->prepare("SELECT ci.*, st.name as state_name, co.name as country_name FROM cities ci JOIN states st ON ci.state_id = st.id JOIN countries co ON st.country_id = co.id WHERE ci.state_id = ? ORDER BY ci.name ASC");
        $stmt->execute([$state_id]);
    } else {
        $stmt = $pdo->query("SELECT ci.*, st.name as state_name, co.name as country_name FROM cities ci JOIN states st ON ci.state_id = st.id JOIN countries co ON st.country_id = co.id ORDER BY ci.name ASC");
    }
    echo json_encode(['data' => $stmt->fetchAll()]);
    exit;
}

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Only Admin can modify Cities']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $state_id = $input['state_id'] ?? null;
    $name = trim($input['name'] ?? '');
    if (!$state_id || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'State ID and City Name are required']);
        exit;
    }
    $stmt = $pdo->prepare("INSERT INTO cities (state_id, name) VALUES (?, ?)");
    $stmt->execute([$state_id, $name]);
    echo json_encode(['message' => 'City created', 'id' => $pdo->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    $id = $input['id'] ?? null;
    $state_id = $input['state_id'] ?? null;
    $name = trim($input['name'] ?? '');
    $status = trim($input['status'] ?? 'active');
    if (!$id || !$state_id || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'ID, State ID, and Name are required']);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE cities SET state_id = ?, name = ?, status = ? WHERE id = ?");
    $stmt->execute([$state_id, $name, $status, $id]);
    echo json_encode(['message' => 'City updated']);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM cities WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['message' => 'City deleted']);
    exit;
}
