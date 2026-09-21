<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $country_id = $_GET['country_id'] ?? null;
    if ($country_id) {
        $stmt = $pdo->prepare("SELECT s.*, c.name as country_name FROM states s JOIN countries c ON s.country_id = c.id WHERE s.country_id = ? ORDER BY s.name ASC");
        $stmt->execute([$country_id]);
    } else {
        $stmt = $pdo->query("SELECT s.*, c.name as country_name FROM states s JOIN countries c ON s.country_id = c.id ORDER BY s.name ASC");
    }
    echo json_encode(['data' => $stmt->fetchAll()]);
    exit;
}

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Only Admin can modify States']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $country_id = $input['country_id'] ?? null;
    $name = trim($input['name'] ?? '');
    if (!$country_id || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'Country ID and State Name are required']);
        exit;
    }
    $stmt = $pdo->prepare("INSERT INTO states (country_id, name) VALUES (?, ?)");
    $stmt->execute([$country_id, $name]);
    echo json_encode(['message' => 'State created', 'id' => $pdo->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    $id = $input['id'] ?? null;
    $country_id = $input['country_id'] ?? null;
    $name = trim($input['name'] ?? '');
    $status = trim($input['status'] ?? 'active');
    if (!$id || !$country_id || !$name) {
        http_response_code(400);
        echo json_encode(['error' => 'ID, Country ID, and Name are required']);
        exit;
    }
    $stmt = $pdo->prepare("UPDATE states SET country_id = ?, name = ?, status = ? WHERE id = ?");
    $stmt->execute([$country_id, $name, $status, $id]);
    echo json_encode(['message' => 'State updated']);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM states WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['message' => 'State deleted']);
    exit;
}
