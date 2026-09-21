<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM user_roles ORDER BY id ASC");
    echo json_encode(['data' => $stmt->fetchAll()]);
    exit;
}

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Only Admin can manage User Roles']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $role_key = trim($input['role_key'] ?? '');
    $role_name = trim($input['role_name'] ?? '');
    $description = trim($input['description'] ?? '');

    if (!$role_key || !$role_name) {
        http_response_code(400);
        echo json_encode(['error' => 'Role Key and Role Name are required']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO user_roles (role_key, role_name, description) VALUES (?, ?, ?)");
    $stmt->execute([strtolower($role_key), $role_name, $description]);
    echo json_encode(['message' => 'User Role created', 'id' => $pdo->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    $id = $input['id'] ?? null;
    $role_name = trim($input['role_name'] ?? '');
    $description = trim($input['description'] ?? '');

    if (!$id || !$role_name) {
        http_response_code(400);
        echo json_encode(['error' => 'ID and Role Name are required']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE user_roles SET role_name = ?, description = ? WHERE id = ?");
    $stmt->execute([$role_name, $description, $id]);
    echo json_encode(['message' => 'User Role updated']);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM user_roles WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['message' => 'User Role deleted']);
    exit;
}
