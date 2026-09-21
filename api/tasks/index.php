<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

// Auto-create tasks table if not exists
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_owner_id INT NULL,
            task_owner_name VARCHAR(255) NULL,
            subject VARCHAR(255) NOT NULL,
            due_date DATE NULL,
            contact_name VARCHAR(255) NULL,
            account_name VARCHAR(255) NULL,
            status VARCHAR(50) DEFAULT 'Not Started',
            priority VARCHAR(50) DEFAULT 'High',
            reminder TINYINT(1) DEFAULT 0,
            repeat_task TINYINT(1) DEFAULT 0,
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
            SELECT t.*, u.full_name as owner_fullname 
            FROM tasks t 
            LEFT JOIN users u ON t.task_owner_id = u.id 
            ORDER BY t.due_date ASC, t.id DESC
        ");
        $tasks = $stmt->fetchAll();

        foreach ($tasks as &$t) {
            if (empty($t['task_owner_name']) && !empty($t['owner_fullname'])) {
                $t['task_owner_name'] = $t['owner_fullname'];
            }
        }

        echo json_encode(['data' => $tasks]);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch tasks: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $subject = trim($input['subject'] ?? '');
    $task_owner_id = !empty($input['task_owner_id']) ? intval($input['task_owner_id']) : $user['id'];
    $task_owner_name = trim($input['task_owner_name'] ?? '');
    if (empty($task_owner_name) && !empty($user['full_name'])) {
        $task_owner_name = $user['full_name'];
    }
    $due_date = !empty($input['due_date']) ? trim($input['due_date']) : null;
    $contact_name = trim($input['contact_name'] ?? '');
    $account_name = trim($input['account_name'] ?? '');
    $status = trim($input['status'] ?? 'Not Started');
    $priority = trim($input['priority'] ?? 'High');
    $reminder = !empty($input['reminder']) ? 1 : 0;
    $repeat_task = !empty($input['repeat_task']) ? 1 : 0;
    $description = trim($input['description'] ?? '');

    if (!$subject) {
        http_response_code(400);
        echo json_encode(['error' => 'Task Subject is required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO tasks 
            (task_owner_id, task_owner_name, subject, due_date, contact_name, account_name, status, priority, reminder, repeat_task, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $task_owner_id,
            $task_owner_name,
            $subject,
            $due_date,
            $contact_name,
            $account_name,
            $status,
            $priority,
            $reminder,
            $repeat_task,
            $description
        ]);

        echo json_encode(['message' => 'Task created successfully', 'id' => $pdo->lastInsertId()]);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create task: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = intval($input['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Task ID is required']);
        exit;
    }

    $subject = trim($input['subject'] ?? '');
    $task_owner_id = !empty($input['task_owner_id']) ? intval($input['task_owner_id']) : null;
    $task_owner_name = trim($input['task_owner_name'] ?? '');
    $due_date = !empty($input['due_date']) ? trim($input['due_date']) : null;
    $contact_name = trim($input['contact_name'] ?? '');
    $account_name = trim($input['account_name'] ?? '');
    $status = trim($input['status'] ?? 'Not Started');
    $priority = trim($input['priority'] ?? 'High');
    $reminder = !empty($input['reminder']) ? 1 : 0;
    $repeat_task = !empty($input['repeat_task']) ? 1 : 0;
    $description = trim($input['description'] ?? '');

    if (!$subject) {
        http_response_code(400);
        echo json_encode(['error' => 'Task Subject is required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            UPDATE tasks SET 
                task_owner_id = ?, 
                task_owner_name = ?, 
                subject = ?, 
                due_date = ?, 
                contact_name = ?, 
                account_name = ?, 
                status = ?, 
                priority = ?, 
                reminder = ?, 
                repeat_task = ?, 
                description = ? 
            WHERE id = ?
        ");
        $stmt->execute([
            $task_owner_id,
            $task_owner_name,
            $subject,
            $due_date,
            $contact_name,
            $account_name,
            $status,
            $priority,
            $reminder,
            $repeat_task,
            $description,
            $id
        ]);

        echo json_encode(['message' => 'Task updated successfully']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update task: ' . $e->getMessage()]);
    }
    exit;
}

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Task ID is required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['message' => 'Task deleted successfully']);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete task: ' . $e->getMessage()]);
    }
    exit;
}
