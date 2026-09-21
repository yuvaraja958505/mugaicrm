<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

$upload_dir = __DIR__ . '/../uploads/attendance/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// Function to handle base64 image saving
function saveBase64Image($base64_string, $prefix, $upload_dir) {
    if (empty($base64_string)) return null;

    if (preg_match('/^data:image\/(\w+);base64,/', $base64_string, $type)) {
        $data = substr($base64_string, strpos($base64_string, ',') + 1);
        $type = strtolower($type[1]);
        if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png', 'webp'])) {
            $type = 'jpg';
        }
        $data = base64_decode($data);
        if ($data === false) return null;
    } else {
        return null;
    }

    $filename = $prefix . '_' . time() . '_' . rand(1000, 9999) . '.' . $type;
    $filepath = $upload_dir . $filename;
    file_put_contents($filepath, $data);
    return 'uploads/attendance/' . $filename;
}

if ($method === 'GET') {
    $today = date('Y-m-d');
    
    // Get today's attendance status for logged in user
    $stmt = $pdo->prepare("SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?");
    $stmt->execute([$user['id'], $today]);
    $today_record = $stmt->fetch();

    // Get attendance history
    if ($user['role'] === 'admin') {
        $stmtHistory = $pdo->query("SELECT a.*, u.full_name, u.username, u.role 
                                   FROM attendance a 
                                   JOIN users u ON a.user_id = u.id 
                                   ORDER BY a.attendance_date DESC, a.id DESC 
                                   LIMIT 100");
        $history = $stmtHistory->fetchAll();
    } else {
        $stmtHistory = $pdo->prepare("SELECT a.*, u.full_name, u.username, u.role 
                                      FROM attendance a 
                                      JOIN users u ON a.user_id = u.id 
                                      WHERE a.user_id = ? 
                                      ORDER BY a.attendance_date DESC, a.id DESC 
                                      LIMIT 50");
        $stmtHistory->execute([$user['id']]);
        $history = $stmtHistory->fetchAll();
    }

    echo json_encode([
        'today' => $today_record ?: null,
        'history' => $history
    ]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? ''; // 'punch_in' or 'punch_out'
    $image_data = $input['image'] ?? '';
    $notes = trim($input['notes'] ?? '');

    if (!$action || !in_array($action, ['punch_in', 'punch_out'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action type']);
        exit;
    }

    if (!$image_data) {
        http_response_code(400);
        echo json_encode(['error' => 'Image capture is required for attendance']);
        exit;
    }

    $image_path = saveBase64Image($image_data, $action . '_' . $user['id'], $upload_dir);
    if (!$image_path) {
        http_response_code(400);
        echo json_encode(['error' => 'Failed to process camera image']);
        exit;
    }

    $today = date('Y-m-d');
    $now = date('H:i:s');

    if ($action === 'punch_in') {
        // Check if already punched in today
        $stmt = $pdo->prepare("SELECT id FROM attendance WHERE user_id = ? AND attendance_date = ?");
        $stmt->execute([$user['id'], $today]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['error' => 'You have already punched in for today!']);
            exit;
        }

        $insert = $pdo->prepare("INSERT INTO attendance (user_id, attendance_date, punch_in_time, punch_in_image, notes) VALUES (?, ?, ?, ?, ?)");
        $insert->execute([$user['id'], $today, $now, $image_path, $notes]);

        echo json_encode([
            'message' => 'Punch In successful!',
            'punch_in_time' => $now,
            'punch_in_image' => $image_path
        ]);
        exit;
    }

    if ($action === 'punch_out') {
        // Check if punched in today
        $stmt = $pdo->prepare("SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?");
        $stmt->execute([$user['id'], $today]);
        $record = $stmt->fetch();

        if (!$record) {
            http_response_code(400);
            echo json_encode(['error' => 'You must Punch In first before Punching Out!']);
            exit;
        }

        if (!empty($record['punch_out_time'])) {
            http_response_code(400);
            echo json_encode(['error' => 'You have already punched out for today!']);
            exit;
        }

        $update = $pdo->prepare("UPDATE attendance SET punch_out_time = ?, punch_out_image = ?, notes = IF(notes = '', ?, CONCAT(notes, ' | ', ?)) WHERE id = ?");
        $update->execute([$now, $image_path, $notes, $notes, $record['id']]);

        echo json_encode([
            'message' => 'Punch Out successful!',
            'punch_out_time' => $now,
            'punch_out_image' => $image_path
        ]);
        exit;
    }
}
