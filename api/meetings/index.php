<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

// Auto-create meetings table if not exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS meetings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            venue VARCHAR(100) DEFAULT 'Client location',
            location TEXT NULL,
            all_day TINYINT(1) DEFAULT 0,
            from_datetime DATETIME NOT NULL,
            to_datetime DATETIME NOT NULL,
            host_id INT NULL,
            host_name VARCHAR(255) NULL,
            participants TEXT NULL,
            related_to VARCHAR(100) DEFAULT 'None',
            related_id INT NULL,
            repeat_frequency VARCHAR(50) DEFAULT 'None',
            description TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
} catch (\PDOException $e) {
    // Table creation handled or already exists
}

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("
            SELECT m.*, u.full_name as host_user_fullname 
            FROM meetings m 
            LEFT JOIN users u ON m.host_id = u.id 
            ORDER BY m.from_datetime DESC, m.id DESC
        ");
        $meetings = $stmt->fetchAll();

        // Ensure host_name falls back nicely if host_user_fullname exists
        foreach ($meetings as &$m) {
            if (empty($m['host_name']) && !empty($m['host_user_fullname'])) {
                $m['host_name'] = $m['host_user_fullname'];
            }
        }

        echo json_encode(['data' => $meetings]);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch meetings: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $title = trim($input['title'] ?? '');
    $venue = trim($input['venue'] ?? 'Client location');
    $location = trim($input['location'] ?? '');
    $all_day = !empty($input['all_day']) ? 1 : 0;
    $from_datetime = trim($input['from_datetime'] ?? '');
    $to_datetime = trim($input['to_datetime'] ?? '');
    $host_id = !empty($input['host_id']) ? intval($input['host_id']) : $user['id'];
    $host_name = trim($input['host_name'] ?? '');
    if (empty($host_name) && !empty($user['full_name'])) {
        $host_name = $user['full_name'];
    }
    $participants = trim($input['participants'] ?? 'None');
    $related_to = trim($input['related_to'] ?? 'None');
    $repeat_frequency = trim($input['repeat_frequency'] ?? 'None');
    $description = trim($input['description'] ?? '');

    if (!$title || !$from_datetime || !$to_datetime) {
        http_response_code(400);
        echo json_encode(['error' => 'Title, From Date/Time, and To Date/Time are required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO meetings 
            (title, venue, location, all_day, from_datetime, to_datetime, host_id, host_name, participants, related_to, repeat_frequency, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $title,
            $venue,
            $location,
            $all_day,
            $from_datetime,
            $to_datetime,
            $host_id,
            $host_name,
            $participants,
            $related_to,
            $repeat_frequency,
            $description
        ]);

        echo json_encode(['message' => 'Meeting created successfully', 'id' => $pdo->lastInsertId()]);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create meeting: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = intval($input['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Meeting ID is required']);
        exit;
    }

    $title = trim($input['title'] ?? '');
    $venue = trim($input['venue'] ?? 'Client location');
    $location = trim($input['location'] ?? '');
    $all_day = !empty($input['all_day']) ? 1 : 0;
    $from_datetime = trim($input['from_datetime'] ?? '');
    $to_datetime = trim($input['to_datetime'] ?? '');
    $host_id = !empty($input['host_id']) ? intval($input['host_id']) : null;
    $host_name = trim($input['host_name'] ?? '');
    $participants = trim($input['participants'] ?? 'None');
    $related_to = trim($input['related_to'] ?? 'None');
    $repeat_frequency = trim($input['repeat_frequency'] ?? 'None');
    $description = trim($input['description'] ?? '');

    if (!$title || !$from_datetime || !$to_datetime) {
        http_response_code(400);
        echo json_encode(['error' => 'Title, From Date/Time, and To Date/Time are required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            UPDATE meetings SET 
                title = ?, 
                venue = ?, 
                location = ?, 
                all_day = ?, 
                from_datetime = ?, 
                to_datetime = ?, 
                host_id = ?, 
                host_name = ?, 
                participants = ?, 
                related_to = ?, 
                repeat_frequency = ?, 
                description = ? 
            WHERE id = ?
        ");
        $stmt->execute([
            $title,
            $venue,
            $location,
            $all_day,
            $from_datetime,
            $to_datetime,
            $host_id,
            $host_name,
            $participants,
            $related_to,
            $repeat_frequency,
            $description,
            $id
        ]);

        echo json_encode(['message' => 'Meeting updated successfully']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update meeting: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Meeting ID is required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM meetings WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Meeting deleted successfully']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete meeting: ' . $e->getMessage()]);
    }
    exit;
}
