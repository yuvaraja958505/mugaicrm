<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

// Auto-create/migrate meetings and meeting_history tables
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS meetings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            venue VARCHAR(100) DEFAULT 'Client location',
            location TEXT NULL,
            meeting_type VARCHAR(50) DEFAULT 'Client Meeting',
            status VARCHAR(50) DEFAULT 'Scheduled',
            reminder VARCHAR(50) DEFAULT '15 minutes',
            online_link TEXT NULL,
            all_day TINYINT(1) DEFAULT 0,
            from_datetime DATETIME NOT NULL,
            to_datetime DATETIME NOT NULL,
            host_id INT NULL,
            host_name VARCHAR(255) NULL,
            participants TEXT NULL,
            related_to VARCHAR(100) DEFAULT 'None',
            related_id INT NULL,
            related_name VARCHAR(255) NULL,
            repeat_frequency VARCHAR(50) DEFAULT 'None',
            description TEXT NULL,
            outcome_notes TEXT NULL,
            next_action TEXT NULL,
            next_followup_date DATE NULL,
            next_followup_time TIME NULL,
            reschedule_reason TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $cols = [
        "meeting_type VARCHAR(50) DEFAULT 'Client Meeting'",
        "status VARCHAR(50) DEFAULT 'Scheduled'",
        "reminder VARCHAR(50) DEFAULT '15 minutes'",
        "online_link TEXT NULL",
        "related_name VARCHAR(255) NULL",
        "outcome_notes TEXT NULL",
        "next_action TEXT NULL",
        "next_followup_date DATE NULL",
        "next_followup_time TIME NULL",
        "reschedule_reason TEXT NULL"
    ];

    foreach ($cols as $colDef) {
        $colName = explode(' ', trim($colDef))[0];
        $check = $pdo->query("SHOW COLUMNS FROM meetings LIKE '$colName'")->fetch();
        if (!$check) {
            $pdo->exec("ALTER TABLE meetings ADD COLUMN $colDef");
        }
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS meeting_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            meeting_id INT NOT NULL,
            action_type VARCHAR(100) NOT NULL,
            notes TEXT NULL,
            user_name VARCHAR(255) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
} catch (\PDOException $e) {
    // Migration handled
}

if ($method === 'GET') {
    // Action: Fetch history logs for a specific meeting
    if (isset($_GET['action']) && $_GET['action'] === 'history') {
        $meeting_id = intval($_GET['meeting_id'] ?? 0);
        if (!$meeting_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Meeting ID is required for history']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM meeting_history WHERE meeting_id = ? ORDER BY created_at DESC, id DESC");
            $stmt->execute([$meeting_id]);
            $logs = $stmt->fetchAll();
            echo json_encode(['data' => $logs]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch meeting history: ' . $e->getMessage()]);
        }
        exit;
    }

    // Default: Fetch all meetings
    try {
        $stmt = $pdo->query("
            SELECT m.*, u.full_name as host_user_fullname 
            FROM meetings m 
            LEFT JOIN users u ON m.host_id = u.id 
            ORDER BY m.from_datetime DESC, m.id DESC
        ");
        $meetings = $stmt->fetchAll();

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
    $meeting_type = trim($input['meeting_type'] ?? 'Client Meeting');
    $status = trim($input['status'] ?? 'Scheduled');
    $reminder = trim($input['reminder'] ?? '15 minutes');
    $online_link = trim($input['online_link'] ?? '');
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
    $related_id = !empty($input['related_id']) ? intval($input['related_id']) : null;
    $related_name = trim($input['related_name'] ?? '');
    $repeat_frequency = trim($input['repeat_frequency'] ?? 'None');
    $description = trim($input['description'] ?? '');
    $outcome_notes = trim($input['outcome_notes'] ?? '');
    $next_action = trim($input['next_action'] ?? '');
    $next_followup_date = !empty($input['next_followup_date']) ? $input['next_followup_date'] : null;
    $next_followup_time = !empty($input['next_followup_time']) ? $input['next_followup_time'] : null;

    if (!$title || !$from_datetime || !$to_datetime) {
        http_response_code(400);
        echo json_encode(['error' => 'Title, From Date/Time, and To Date/Time are required.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO meetings 
            (title, venue, location, meeting_type, status, reminder, online_link, all_day, from_datetime, to_datetime, host_id, host_name, participants, related_to, related_id, related_name, repeat_frequency, description, outcome_notes, next_action, next_followup_date, next_followup_time) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $title,
            $venue,
            $location,
            $meeting_type,
            $status,
            $reminder,
            $online_link,
            $all_day,
            $from_datetime,
            $to_datetime,
            $host_id,
            $host_name,
            $participants,
            $related_to,
            $related_id,
            $related_name,
            $repeat_frequency,
            $description,
            $outcome_notes,
            $next_action,
            $next_followup_date,
            $next_followup_time
        ]);

        $meeting_id = $pdo->lastInsertId();

        // Log history entry
        $hist = $pdo->prepare("INSERT INTO meeting_history (meeting_id, action_type, notes, user_name) VALUES (?, ?, ?, ?)");
        $hist->execute([
            $meeting_id,
            'Created',
            "Meeting '$title' scheduled for $from_datetime (Type: $meeting_type, Host: $host_name).",
            $user['full_name'] ?? 'System'
        ]);

        // Sync to lead_followups if related to a lead and next followup date is provided
        if ($related_to === 'Lead' && $related_id && $next_followup_date) {
            try {
                $fStmt = $pdo->prepare("
                    INSERT INTO lead_followups (lead_id, followup_date, followup_time, notes, created_by)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $fNotes = "[Meeting Follow-Up] Meeting: $title. Next Action: " . ($next_action ?: 'Scheduled via Meeting');
                $fStmt->execute([$related_id, $next_followup_date, $next_followup_time ?: '10:00:00', $fNotes, $user['full_name'] ?? 'System']);
                
                // Update lead next followup date
                $lStmt = $pdo->prepare("UPDATE leads SET next_followup_date = ?, next_followup_time = ?, next_followup_required = 1 WHERE id = ?");
                $lStmt->execute([$next_followup_date, $next_followup_time ?: '10:00:00', $related_id]);
            } catch (\PDOException $ex) {}
        }

        echo json_encode(['message' => 'Meeting created successfully', 'id' => $meeting_id]);
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

    // Get current meeting state for history tracking
    $oldStmt = $pdo->prepare("SELECT * FROM meetings WHERE id = ?");
    $oldStmt->execute([$id]);
    $oldMeeting = $oldStmt->fetch();

    $title = trim($input['title'] ?? ($oldMeeting['title'] ?? ''));
    $venue = trim($input['venue'] ?? ($oldMeeting['venue'] ?? 'Client location'));
    $location = trim($input['location'] ?? ($oldMeeting['location'] ?? ''));
    $meeting_type = trim($input['meeting_type'] ?? ($oldMeeting['meeting_type'] ?? 'Client Meeting'));
    $status = trim($input['status'] ?? ($oldMeeting['status'] ?? 'Scheduled'));
    $reminder = trim($input['reminder'] ?? ($oldMeeting['reminder'] ?? '15 minutes'));
    $online_link = trim($input['online_link'] ?? ($oldMeeting['online_link'] ?? ''));
    $all_day = isset($input['all_day']) ? (!empty($input['all_day']) ? 1 : 0) : ($oldMeeting['all_day'] ?? 0);
    $from_datetime = trim($input['from_datetime'] ?? ($oldMeeting['from_datetime'] ?? ''));
    $to_datetime = trim($input['to_datetime'] ?? ($oldMeeting['to_datetime'] ?? ''));
    $host_id = !empty($input['host_id']) ? intval($input['host_id']) : ($oldMeeting['host_id'] ?? null);
    $host_name = trim($input['host_name'] ?? ($oldMeeting['host_name'] ?? ''));
    $participants = trim($input['participants'] ?? ($oldMeeting['participants'] ?? 'None'));
    $related_to = trim($input['related_to'] ?? ($oldMeeting['related_to'] ?? 'None'));
    $related_id = !empty($input['related_id']) ? intval($input['related_id']) : ($oldMeeting['related_id'] ?? null);
    $related_name = trim($input['related_name'] ?? ($oldMeeting['related_name'] ?? ''));
    $repeat_frequency = trim($input['repeat_frequency'] ?? ($oldMeeting['repeat_frequency'] ?? 'None'));
    $description = trim($input['description'] ?? ($oldMeeting['description'] ?? ''));
    $outcome_notes = trim($input['outcome_notes'] ?? ($oldMeeting['outcome_notes'] ?? ''));
    $next_action = trim($input['next_action'] ?? ($oldMeeting['next_action'] ?? ''));
    $next_followup_date = !empty($input['next_followup_date']) ? $input['next_followup_date'] : null;
    $next_followup_time = !empty($input['next_followup_time']) ? $input['next_followup_time'] : null;
    $reschedule_reason = trim($input['reschedule_reason'] ?? '');

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
                meeting_type = ?,
                status = ?,
                reminder = ?,
                online_link = ?,
                all_day = ?, 
                from_datetime = ?, 
                to_datetime = ?, 
                host_id = ?, 
                host_name = ?, 
                participants = ?, 
                related_to = ?, 
                related_id = ?,
                related_name = ?,
                repeat_frequency = ?, 
                description = ?,
                outcome_notes = ?,
                next_action = ?,
                next_followup_date = ?,
                next_followup_time = ?,
                reschedule_reason = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $title,
            $venue,
            $location,
            $meeting_type,
            $status,
            $reminder,
            $online_link,
            $all_day,
            $from_datetime,
            $to_datetime,
            $host_id,
            $host_name,
            $participants,
            $related_to,
            $related_id,
            $related_name,
            $repeat_frequency,
            $description,
            $outcome_notes,
            $next_action,
            $next_followup_date,
            $next_followup_time,
            $reschedule_reason,
            $id
        ]);

        // Detect action for History log
        $action_type = 'Updated';
        $log_notes = "Meeting details updated.";

        if ($oldMeeting) {
            if ($status === 'Rescheduled' || ($oldMeeting['from_datetime'] !== $from_datetime && $status !== 'Completed')) {
                $action_type = 'Rescheduled';
                $log_notes = "Rescheduled from " . $oldMeeting['from_datetime'] . " to " . $from_datetime;
                if ($reschedule_reason) {
                    $log_notes .= ". Reason: " . $reschedule_reason;
                }
            } else if ($status === 'Completed' && $oldMeeting['status'] !== 'Completed') {
                $action_type = 'Completed';
                $log_notes = "Meeting marked as Completed. Outcome: " . ($outcome_notes ?: 'No outcome notes recorded');
                if ($next_action) {
                    $log_notes .= " | Next Action: " . $next_action;
                }
            } else if ($status === 'Cancelled' && $oldMeeting['status'] !== 'Cancelled') {
                $action_type = 'Cancelled';
                $log_notes = "Meeting status changed to Cancelled.";
            } else if ($oldMeeting['status'] !== $status) {
                $action_type = 'Status Change';
                $log_notes = "Status changed from '{$oldMeeting['status']}' to '$status'.";
            }
        }

        $hist = $pdo->prepare("INSERT INTO meeting_history (meeting_id, action_type, notes, user_name) VALUES (?, ?, ?, ?)");
        $hist->execute([
            $id,
            $action_type,
            $log_notes,
            $user['full_name'] ?? 'System'
        ]);

        // Sync to lead_followups if related to a lead and next followup date is provided
        if ($related_to === 'Lead' && $related_id && $next_followup_date) {
            try {
                $fStmt = $pdo->prepare("
                    INSERT INTO lead_followups (lead_id, followup_date, followup_time, notes, created_by)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $fNotes = "[Meeting Outcome Follow-Up] Meeting: $title. Outcome: " . ($outcome_notes ?: 'Completed') . ". Next Action: " . ($next_action ?: 'N/A');
                $fStmt->execute([$related_id, $next_followup_date, $next_followup_time ?: '10:00:00', $fNotes, $user['full_name'] ?? 'System']);
                
                $lStmt = $pdo->prepare("UPDATE leads SET next_followup_date = ?, next_followup_time = ?, next_followup_required = 1 WHERE id = ?");
                $lStmt->execute([$next_followup_date, $next_followup_time ?: '10:00:00', $related_id]);
            } catch (\PDOException $ex) {}
        }

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
