<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? '';

// GET request
if ($method === 'GET') {
    switch ($type) {
        case 'domains':
            $stmt = $pdo->query("SELECT * FROM business_domains ORDER BY name ASC");
            echo json_encode(['data' => $stmt->fetchAll()]);
            break;

        case 'services':
            $stmt = $pdo->query("SELECT * FROM services ORDER BY name ASC");
            echo json_encode(['data' => $stmt->fetchAll()]);
            break;

        case 'countries':
            $stmt = $pdo->query("SELECT * FROM countries ORDER BY name ASC");
            echo json_encode(['data' => $stmt->fetchAll()]);
            break;

        case 'states':
            $country_id = $_GET['country_id'] ?? null;
            if ($country_id) {
                $stmt = $pdo->prepare("SELECT s.*, c.name as country_name FROM states s JOIN countries c ON s.country_id = c.id WHERE s.country_id = ? ORDER BY s.name ASC");
                $stmt->execute([$country_id]);
            } else {
                $stmt = $pdo->query("SELECT s.*, c.name as country_name FROM states s JOIN countries c ON s.country_id = c.id ORDER BY s.name ASC");
            }
            echo json_encode(['data' => $stmt->fetchAll()]);
            break;

        case 'cities':
            $state_id = $_GET['state_id'] ?? null;
            if ($state_id) {
                $stmt = $pdo->prepare("SELECT ci.*, st.name as state_name, co.name as country_name FROM cities ci JOIN states st ON ci.state_id = st.id JOIN countries co ON st.country_id = co.id WHERE ci.state_id = ? ORDER BY ci.name ASC");
                $stmt->execute([$state_id]);
            } else {
                $stmt = $pdo->query("SELECT ci.*, st.name as state_name, co.name as country_name FROM cities ci JOIN states st ON ci.state_id = st.id JOIN countries co ON st.country_id = co.id ORDER BY ci.name ASC");
            }
            echo json_encode(['data' => $stmt->fetchAll()]);
            break;

        default:
            // Fetch all master metadata in one go for fast dropdown populating
            $domains = $pdo->query("SELECT * FROM business_domains WHERE status = 'active' ORDER BY name ASC")->fetchAll();
            $services = $pdo->query("SELECT * FROM services WHERE status = 'active' ORDER BY name ASC")->fetchAll();
            $countries = $pdo->query("SELECT * FROM countries WHERE status = 'active' ORDER BY name ASC")->fetchAll();
            $states = $pdo->query("SELECT s.*, c.name as country_name FROM states s JOIN countries c ON s.country_id = c.id WHERE s.status = 'active' ORDER BY s.name ASC")->fetchAll();
            $cities = $pdo->query("SELECT ci.*, st.name as state_name, co.name as country_name FROM cities ci JOIN states st ON ci.state_id = st.id JOIN countries co ON st.country_id = co.id WHERE ci.status = 'active' ORDER BY ci.name ASC")->fetchAll();

            echo json_encode([
                'domains' => $domains,
                'services' => $services,
                'countries' => $countries,
                'states' => $states,
                'cities' => $cities
            ]);
            break;
    }
    exit;
}

// Ensure user is admin for mutating master tables
if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: Only admin can manage master tables']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    switch ($type) {
        case 'domains':
            $name = trim($input['name'] ?? '');
            $desc = trim($input['description'] ?? '');
            if (!$name) { http_response_code(400); echo json_encode(['error' => 'Name is required']); exit; }
            $stmt = $pdo->prepare("INSERT INTO business_domains (name, description) VALUES (?, ?)");
            $stmt->execute([$name, $desc]);
            echo json_encode(['message' => 'Domain created', 'id' => $pdo->lastInsertId()]);
            break;

        case 'services':
            $name = trim($input['name'] ?? '');
            $desc = trim($input['description'] ?? '');
            if (!$name) { http_response_code(400); echo json_encode(['error' => 'Name is required']); exit; }
            $stmt = $pdo->prepare("INSERT INTO services (name, description) VALUES (?, ?)");
            $stmt->execute([$name, $desc]);
            echo json_encode(['message' => 'Service created', 'id' => $pdo->lastInsertId()]);
            break;

        case 'countries':
            $name = trim($input['name'] ?? '');
            $code = trim($input['code'] ?? '');
            if (!$name) { http_response_code(400); echo json_encode(['error' => 'Name is required']); exit; }
            $stmt = $pdo->prepare("INSERT INTO countries (name, code) VALUES (?, ?)");
            $stmt->execute([$name, $code]);
            echo json_encode(['message' => 'Country created', 'id' => $pdo->lastInsertId()]);
            break;

        case 'states':
            $country_id = $input['country_id'] ?? null;
            $name = trim($input['name'] ?? '');
            if (!$country_id || !$name) { http_response_code(400); echo json_encode(['error' => 'Country ID and Name are required']); exit; }
            $stmt = $pdo->prepare("INSERT INTO states (country_id, name) VALUES (?, ?)");
            $stmt->execute([$country_id, $name]);
            echo json_encode(['message' => 'State created', 'id' => $pdo->lastInsertId()]);
            break;

        case 'cities':
            $state_id = $input['state_id'] ?? null;
            $name = trim($input['name'] ?? '');
            if (!$state_id || !$name) { http_response_code(400); echo json_encode(['error' => 'State ID and Name are required']); exit; }
            $stmt = $pdo->prepare("INSERT INTO cities (state_id, name) VALUES (?, ?)");
            $stmt->execute([$state_id, $name]);
            echo json_encode(['message' => 'City created', 'id' => $pdo->lastInsertId()]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid master type']);
            break;
    }
    exit;
}

if ($method === 'PUT') {
    $id = $input['id'] ?? null;
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID is required']); exit; }

    switch ($type) {
        case 'domains':
            $stmt = $pdo->prepare("UPDATE business_domains SET name = ?, description = ?, status = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? '', $input['status'] ?? 'active', $id]);
            echo json_encode(['message' => 'Domain updated']);
            break;

        case 'services':
            $stmt = $pdo->prepare("UPDATE services SET name = ?, description = ?, status = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['description'] ?? '', $input['status'] ?? 'active', $id]);
            echo json_encode(['message' => 'Service updated']);
            break;

        case 'countries':
            $stmt = $pdo->prepare("UPDATE countries SET name = ?, code = ?, status = ? WHERE id = ?");
            $stmt->execute([$input['name'], $input['code'] ?? '', $input['status'] ?? 'active', $id]);
            echo json_encode(['message' => 'Country updated']);
            break;

        case 'states':
            $stmt = $pdo->prepare("UPDATE states SET country_id = ?, name = ?, status = ? WHERE id = ?");
            $stmt->execute([$input['country_id'], $input['name'], $input['status'] ?? 'active', $id]);
            echo json_encode(['message' => 'State updated']);
            break;

        case 'cities':
            $stmt = $pdo->prepare("UPDATE cities SET state_id = ?, name = ?, status = ? WHERE id = ?");
            $stmt->execute([$input['state_id'], $input['name'], $input['status'] ?? 'active', $id]);
            echo json_encode(['message' => 'City updated']);
            break;
    }
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID is required']); exit; }

    $tables = [
        'domains' => 'business_domains',
        'services' => 'services',
        'countries' => 'countries',
        'states' => 'states',
        'cities' => 'cities'
    ];

    if (isset($tables[$type])) {
        $table = $tables[$type];
        $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Record deleted successfully']);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid master type']);
    }
    exit;
}
