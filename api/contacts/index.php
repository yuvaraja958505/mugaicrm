<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

// Ensure contacts table exists
$pdo->exec("CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    if ($search !== '') {
        $stmt = $pdo->prepare("SELECT * FROM contacts WHERE name LIKE ? OR mobile LIKE ? OR description LIKE ? ORDER BY id DESC");
        $term = "%$search%";
        $stmt->execute([$term, $term, $term]);
    } else {
        $stmt = $pdo->query("SELECT * FROM contacts ORDER BY id DESC");
    }
    echo json_encode(['data' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $name = trim($input['name'] ?? '');
    $mobile = trim($input['mobile'] ?? '');
    $description = trim($input['description'] ?? '');

    if (!$name || !$mobile) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and Mobile Number are required fields']);
        exit;
    }

    // Check if mobile already exists in contacts
    $check = $pdo->prepare("SELECT id FROM contacts WHERE mobile = ?");
    $check->execute([$mobile]);
    if ($check->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'A contact with this mobile number already exists']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO contacts (name, mobile, description) VALUES (?, ?, ?)");
    $stmt->execute([$name, $mobile, $description]);

    echo json_encode(['message' => 'Contact created successfully', 'id' => $pdo->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = intval($input['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Contact ID is required']);
        exit;
    }

    $name = trim($input['name'] ?? '');
    $mobile = trim($input['mobile'] ?? '');
    $description = trim($input['description'] ?? '');

    if (!$name || !$mobile) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and Mobile Number are required']);
        exit;
    }

    // Check if mobile taken by another contact
    $check = $pdo->prepare("SELECT id FROM contacts WHERE mobile = ? AND id != ?");
    $check->execute([$mobile, $id]);
    if ($check->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Mobile number is already taken by another contact']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE contacts SET name = ?, mobile = ?, description = ? WHERE id = ?");
    $stmt->execute([$name, $mobile, $description, $id]);

    echo json_encode(['message' => 'Contact updated successfully']);
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
        echo json_encode(['error' => 'Contact ID is required']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM contacts WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['message' => 'Contact deleted successfully']);
    exit;
}
