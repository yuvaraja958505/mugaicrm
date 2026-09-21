<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT id, username, role, full_name, created_at FROM users ORDER BY id ASC");
    echo json_encode(['data' => $stmt->fetchAll()]);
    exit;
}

if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Only admin can manage users']);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $username = trim($input['username'] ?? '');
    $password = trim($input['password'] ?? '');
    $full_name = trim($input['full_name'] ?? '');
    $role = trim($input['role'] ?? 'sales');

    if (!$username || !$password || !$full_name) {
        http_response_code(400);
        echo json_encode(['error' => 'Username, Password, and Full Name are required']);
        exit;
    }

    if (!in_array($role, ['admin', 'sales', 'developer', 'ui_ux'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid role specified']);
        exit;
    }

    // Check existing username
    $check = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $check->execute([$username]);
    if ($check->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Username already exists']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)");
    $stmt->execute([$username, $hash, $role, $full_name]);

    echo json_encode(['message' => 'User created successfully', 'id' => $pdo->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = intval($input['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }

    $username = trim($input['username'] ?? '');
    $full_name = trim($input['full_name'] ?? '');
    $role = trim($input['role'] ?? 'sales');
    $password = trim($input['password'] ?? '');

    if (!$username || !$full_name) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and Full Name are required']);
        exit;
    }

    if (!in_array($role, ['admin', 'sales', 'developer', 'ui_ux'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid role specified']);
        exit;
    }

    // Check if username taken by another user
    $check = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $check->execute([$username, $id]);
    if ($check->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Username is already taken by another account']);
        exit;
    }

    if ($password !== '') {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("UPDATE users SET username = ?, password_hash = ?, role = ?, full_name = ? WHERE id = ?");
        $stmt->execute([$username, $hash, $role, $full_name, $id]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET username = ?, role = ?, full_name = ? WHERE id = ?");
        $stmt->execute([$username, $role, $full_name, $id]);
    }

    echo json_encode(['message' => 'User account updated successfully']);
    exit;
}

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = intval($input['id'] ?? 0);
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }

    if ($id === intval($user['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'You cannot delete your own logged-in user account']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['message' => 'User account deleted successfully']);
    exit;
}

