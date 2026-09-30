<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

// Ensure next_followup_time column exists in leads table
try {
    $pdo->exec("ALTER TABLE leads ADD COLUMN next_followup_time TIME NULL AFTER next_followup_date");
} catch (Exception $e) {}
try {
    $pdo->exec("ALTER TABLE leads MODIFY COLUMN status VARCHAR(50) DEFAULT 'New'");
} catch (Exception $e) {}

// Auto-create lead_followups history table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS lead_followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    followup_date DATE NULL,
    followup_time TIME NULL,
    notes TEXT NULL,
    status VARCHAR(50) NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

if ($method === 'GET') {
    // Return all leads list for dropdown in manual follow-up creation
    if (!empty($_GET['all_leads'])) {
        $sql = "SELECT id, name, contact, business_name, status, next_followup_date, next_followup_time, notes FROM leads";
        $params = [];
        if ($user['role'] !== 'admin') {
            $sql .= " WHERE (lead_owner_id = ? OR created_by = ?)";
            $params[] = $user['id'];
            $params[] = $user['id'];
        }
        $sql .= " ORDER BY name ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $allLeads = $stmt->fetchAll();
        echo json_encode(['data' => $allLeads]);
        exit;
    }

    $lead_id = $_GET['lead_id'] ?? null;

    // If specific lead_id passed, return full follow-up log history for that lead
    if ($lead_id) {
        $stmt = $pdo->prepare("SELECT f.*, u.full_name as creator_name 
            FROM lead_followups f 
            LEFT JOIN users u ON f.created_by = u.id 
            WHERE f.lead_id = ? 
            ORDER BY f.id DESC");
        $stmt->execute([$lead_id]);
        $history = $stmt->fetchAll();
        echo json_encode(['data' => $history]);
        exit;
    }

    // Fetch list of leads requiring follow-up
    $sql = "SELECT l.id, l.name, l.contact, l.email, l.business_name, l.status,
            l.next_followup_required, l.next_followup_date, l.next_followup_time, l.notes,
            owner.full_name as owner_name, owner.id as lead_owner_id
            FROM leads l
            LEFT JOIN users owner ON l.lead_owner_id = owner.id
            WHERE (l.next_followup_required = 1 OR l.next_followup_date IS NOT NULL)";

    $params = [];
    if ($user['role'] !== 'admin') {
        $sql .= " AND (l.lead_owner_id = ? OR l.created_by = ?)";
        $params[] = $user['id'];
        $params[] = $user['id'];
    }

    $sql .= " ORDER BY l.next_followup_date ASC, l.next_followup_time ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $followups = $stmt->fetchAll();

    // Attach history logs for each lead
    foreach ($followups as &$f) {
        $hStmt = $pdo->prepare("SELECT f.*, u.full_name as creator_name 
            FROM lead_followups f 
            LEFT JOIN users u ON f.created_by = u.id 
            WHERE f.lead_id = ? 
            ORDER BY f.id DESC");
        $hStmt->execute([$f['id']]);
        $f['history'] = $hStmt->fetchAll();
    }

    echo json_encode(['data' => $followups]);
    exit;
}

if ($method === 'POST' || $method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = intval($input['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Lead selection is required']);
        exit;
    }

    // Verify lead existence and permission
    $checkStmt = $pdo->prepare("SELECT * FROM leads WHERE id = ?" . ($user['role'] !== 'admin' ? " AND (lead_owner_id = {$user['id']} OR created_by = {$user['id']})" : ""));
    $checkStmt->execute([$id]);
    $currentLead = $checkStmt->fetch();

    if (!$currentLead) {
        http_response_code(404);
        echo json_encode(['error' => 'Lead not found or permission denied']);
        exit;
    }

    $next_followup_required = !empty($input['next_followup_required']) ? 1 : 0;
    $next_followup_date = ($next_followup_required && !empty($input['next_followup_date'])) ? $input['next_followup_date'] : null;
    $next_followup_time = ($next_followup_required && !empty($input['next_followup_time'])) ? $input['next_followup_time'] : null;
    $new_note = trim($input['notes'] ?? '');
    $status = trim($input['status'] ?? ($currentLead['status'] ?: 'In Progress'));

    // 1. Insert new note entry into lead_followups history table if note is provided
    if ($new_note !== '') {
        $logStmt = $pdo->prepare("INSERT INTO lead_followups 
            (lead_id, followup_date, followup_time, notes, status, created_by) 
            VALUES (?, ?, ?, ?, ?, ?)");
        $logStmt->execute([$id, $next_followup_date, $next_followup_time, $new_note, $status, $user['id']]);
    }

    // 2. Accumulate notes in leads.notes so cumulative log is preserved in leads table too
    $timestampHeader = date('Y-m-d h:i A') . " - " . ($user['full_name'] ?? 'User');
    $existingNotes = trim($currentLead['notes'] ?? '');

    if ($new_note !== '') {
        $formattedNewNote = "[$timestampHeader]\n$new_note";
        $accumulatedNotes = $existingNotes !== '' ? "$formattedNewNote\n\n-------------------\n\n$existingNotes" : $formattedNewNote;
    } else {
        $accumulatedNotes = $existingNotes;
    }

    // 3. Update main leads record
    $sql = "UPDATE leads SET 
            next_followup_required = ?, 
            next_followup_date = ?, 
            next_followup_time = ?, 
            notes = ?, 
            status = ? 
            WHERE id = ?";

    $params = [$next_followup_required, $next_followup_date, $next_followup_time, $accumulatedNotes, $status, $id];

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['message' => 'Follow-up saved successfully']);
    exit;
}
