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


if ($method === 'GET') {
    $id = $_GET['id'] ?? null;

    if ($id) {
        $sql = "SELECT l.*, 
                bd.name as domain_name, 
                c.name as city_name, 
                st.name as state_name, 
                co.name as country_name,
                u.full_name as creator_name,
                owner.full_name as owner_name
                FROM leads l
                LEFT JOIN business_domains bd ON l.domain_id = bd.id
                LEFT JOIN cities c ON l.city_id = c.id
                LEFT JOIN states st ON c.state_id = st.id
                LEFT JOIN countries co ON st.country_id = co.id
                LEFT JOIN users u ON l.created_by = u.id
                LEFT JOIN users owner ON l.lead_owner_id = owner.id
                WHERE l.id = ?";
                
        $params = [$id];
        if ($user['role'] !== 'admin') {
            $sql .= " AND (l.lead_owner_id = ? OR l.created_by = ?)";
            $params[] = $user['id'];
            $params[] = $user['id'];
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $lead = $stmt->fetch();

        if ($lead) {
            $lead['required_services'] = json_decode($lead['required_services'] ?? '[]', true) ?? [];
        }

        echo json_encode(['data' => $lead ?: null]);
        exit;
    }

    // List all leads
    $sql = "SELECT l.*, 
            bd.name as domain_name, 
            c.name as city_name, 
            st.name as state_name, 
            co.name as country_name,
            u.full_name as creator_name,
            owner.full_name as owner_name
            FROM leads l
            LEFT JOIN business_domains bd ON l.domain_id = bd.id
            LEFT JOIN cities c ON l.city_id = c.id
            LEFT JOIN states st ON c.state_id = st.id
            LEFT JOIN countries co ON st.country_id = co.id
            LEFT JOIN users u ON l.created_by = u.id
            LEFT JOIN users owner ON l.lead_owner_id = owner.id";

    $params = [];
    if ($user['role'] !== 'admin') {
        $sql .= " WHERE (l.lead_owner_id = ? OR l.created_by = ?)";
        $params[] = $user['id'];
        $params[] = $user['id'];
    }

    $sql .= " ORDER BY l.id DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $leads = $stmt->fetchAll();

    foreach ($leads as &$lead) {
        if (!empty($lead['required_services'])) {
            $lead['required_services'] = json_decode($lead['required_services'], true) ?? [];
        } else {
            $lead['required_services'] = [];
        }
    }

    echo json_encode(['data' => $leads]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $name = trim($input['name'] ?? '');
    $contact = trim($input['contact'] ?? '');
    $email = trim($input['email'] ?? '');
    $business_name = trim($input['business_name'] ?? '');
    $website = trim($input['website'] ?? '');
    $domain_id = !empty($input['domain_id']) ? (int)$input['domain_id'] : null;
    $interested_domain = trim($input['interested_domain'] ?? '');
    $lead_source = trim($input['lead_source'] ?? '');
    $address = trim($input['address'] ?? '');
    $city_id = !empty($input['city_id']) ? (int)$input['city_id'] : null;
    $required_services = is_array($input['required_services'] ?? null) ? json_encode($input['required_services']) : json_encode([]);
    $expected_budget = (float)($input['expected_budget'] ?? 0);
    $company_budget = (float)($input['company_budget'] ?? 0);
    $closed_budget = (float)($input['closed_budget'] ?? 0);
    $notes = trim($input['notes'] ?? '');
    $next_followup_required = !empty($input['next_followup_required']) ? 1 : 0;
    $next_followup_date = ($next_followup_required && !empty($input['next_followup_date'])) ? $input['next_followup_date'] : null;
    $next_followup_time = ($next_followup_required && !empty($input['next_followup_time'])) ? $input['next_followup_time'] : null;
    $status = trim($input['status'] ?? 'New');

    // Lead Owner Logic: Non-admin is locked to themselves
    if ($user['role'] === 'admin' && !empty($input['lead_owner_id'])) {
        $lead_owner_id = (int)$input['lead_owner_id'];
    } else {
        $lead_owner_id = $user['id'];
    }

    // Validate that Lead Owner has the 'sales' or 'admin' role
    if ($lead_owner_id) {
        $ownerStmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $ownerStmt->execute([$lead_owner_id]);
        $ownerUser = $ownerStmt->fetch();
        if (!$ownerUser || !in_array($ownerUser['role'], ['sales', 'admin'])) {
            http_response_code(400);
            echo json_encode(['error' => 'A lead can only be assigned to a user with the SALES or ADMIN role']);
            exit;
        }
    }

    if (!$name || !$contact || !$business_name) {
        http_response_code(400);
        echo json_encode(['error' => 'Name, Contact, and Business Name are required fields']);
        exit;
    }

    // Duplicate Lead Contact Number Check
    $dupCheck = $pdo->prepare("SELECT id FROM leads WHERE contact = ?");
    $dupCheck->execute([$contact]);
    if ($dupCheck->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => "A lead with contact number '$contact' already exists! Duplicate leads are not allowed."]);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO leads (
        name, contact, email, business_name, website, domain_id, interested_domain, 
        lead_source, address, city_id, required_services, expected_budget, company_budget, 
        closed_budget, notes, next_followup_required, next_followup_date, next_followup_time, 
        status, lead_owner_id, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->execute([
        $name, $contact, $email, $business_name, $website, $domain_id, $interested_domain,
        $lead_source, $address, $city_id, $required_services, $expected_budget, $company_budget,
        $closed_budget, $notes, $next_followup_required, $next_followup_date, $next_followup_time,
        $status, $lead_owner_id, $user['id']
    ]);

    $leadId = $pdo->lastInsertId();

    // Log initial follow-up note to history table
    if (!empty($notes)) {
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

        $logStmt = $pdo->prepare("INSERT INTO lead_followups (lead_id, followup_date, followup_time, notes, status, created_by) VALUES (?, ?, ?, ?, ?, ?)");
        $logStmt->execute([$leadId, $next_followup_date, $next_followup_time, $notes, $status, $user['id']]);
    }

    // Directly store/sync lead contact into contacts table
    $pdo->exec("CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $contactDesc = "Lead: $business_name" . ($lead_source ? " ($lead_source)" : '');
    $contactStmt = $pdo->prepare("INSERT INTO contacts (name, mobile, description) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)");
    $contactStmt->execute([$name, $contact, $contactDesc]);

    echo json_encode(['message' => 'Lead created successfully', 'id' => $leadId]);
    exit;
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Lead ID is required']);
        exit;
    }

    $name = trim($input['name'] ?? '');
    $contact = trim($input['contact'] ?? '');
    $email = trim($input['email'] ?? '');
    $business_name = trim($input['business_name'] ?? '');
    $website = trim($input['website'] ?? '');
    $domain_id = !empty($input['domain_id']) ? (int)$input['domain_id'] : null;
    $interested_domain = trim($input['interested_domain'] ?? '');
    $lead_source = trim($input['lead_source'] ?? '');
    $address = trim($input['address'] ?? '');
    $city_id = !empty($input['city_id']) ? (int)$input['city_id'] : null;
    $required_services = is_array($input['required_services'] ?? null) ? json_encode($input['required_services']) : json_encode([]);
    $expected_budget = (float)($input['expected_budget'] ?? 0);
    $company_budget = (float)($input['company_budget'] ?? 0);
    $closed_budget = (float)($input['closed_budget'] ?? 0);
    $notes = trim($input['notes'] ?? '');
    $next_followup_required = !empty($input['next_followup_required']) ? 1 : 0;
    $next_followup_date = ($next_followup_required && !empty($input['next_followup_date'])) ? $input['next_followup_date'] : null;
    $next_followup_time = ($next_followup_required && !empty($input['next_followup_time'])) ? $input['next_followup_time'] : null;
    $status = trim($input['status'] ?? 'New');

    // Lead Owner Logic: Non-admin retains current owner or forces themselves
    if ($user['role'] === 'admin' && !empty($input['lead_owner_id'])) {
        $lead_owner_id = (int)$input['lead_owner_id'];
    } else {
        $lead_owner_id = $user['id'];
    }

    // Validate that Lead Owner has the 'sales' or 'admin' role
    if ($lead_owner_id) {
        $ownerStmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $ownerStmt->execute([$lead_owner_id]);
        $ownerUser = $ownerStmt->fetch();
        if (!$ownerUser || !in_array($ownerUser['role'], ['sales', 'admin'])) {
            http_response_code(400);
            echo json_encode(['error' => 'A lead can only be assigned to a user with the SALES or ADMIN role']);
            exit;
        }
    }

    // Duplicate Lead Contact Number Check (excluding current lead ID)
    $dupCheck = $pdo->prepare("SELECT id FROM leads WHERE contact = ? AND id != ?");
    $dupCheck->execute([$contact, $id]);
    if ($dupCheck->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => "Another lead with contact number '$contact' already exists! Duplicate leads are not allowed."]);
        exit;
    }

    if ($user['role'] === 'admin') {
        $stmt = $pdo->prepare("UPDATE leads SET 
            name = ?, contact = ?, email = ?, business_name = ?, website = ?, domain_id = ?, 
            interested_domain = ?, lead_source = ?, address = ?, city_id = ?, 
            required_services = ?, expected_budget = ?, company_budget = ?, closed_budget = ?, 
            notes = ?, next_followup_required = ?, next_followup_date = ?, next_followup_time = ?, 
            status = ?, lead_owner_id = ?
            WHERE id = ?");
        $stmt->execute([
            $name, $contact, $email, $business_name, $website, $domain_id,
            $interested_domain, $lead_source, $address, $city_id,
            $required_services, $expected_budget, $company_budget, $closed_budget,
            $notes, $next_followup_required, $next_followup_date, $next_followup_time,
            $status, $lead_owner_id, $id
        ]);
    } else {
        $stmt = $pdo->prepare("UPDATE leads SET 
            name = ?, contact = ?, email = ?, business_name = ?, website = ?, domain_id = ?, 
            interested_domain = ?, lead_source = ?, address = ?, city_id = ?, 
            required_services = ?, expected_budget = ?, company_budget = ?, closed_budget = ?, 
            notes = ?, next_followup_required = ?, next_followup_date = ?, next_followup_time = ?, 
            status = ?
            WHERE id = ?" . ($user['role'] !== 'admin' ? " AND (lead_owner_id = {$user['id']} OR created_by = {$user['id']})" : ""));
        $stmt->execute([
            $name, $contact, $email, $business_name, $website, $domain_id,
            $interested_domain, $lead_source, $address, $city_id,
            $required_services, $expected_budget, $company_budget, $closed_budget,
            $notes, $next_followup_required, $next_followup_date, $next_followup_time,
            $status, $id
        ]);
    }

    // Directly store/sync lead contact into contacts table
    $pdo->exec("CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL UNIQUE,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $contactDesc = "Lead: $business_name" . ($lead_source ? " ($lead_source)" : '');
    $contactStmt = $pdo->prepare("INSERT INTO contacts (name, mobile, description) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)");
    $contactStmt->execute([$name, $contact, $contactDesc]);

    echo json_encode(['message' => 'Lead updated successfully']);
    exit;
}


if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Lead ID is required']);
        exit;
    }

    $sql = "DELETE FROM leads WHERE id = ?";
    $params = [$id];
    if ($user['role'] !== 'admin') {
        $sql .= " AND (lead_owner_id = ? OR created_by = ?)";
        $params[] = $user['id'];
        $params[] = $user['id'];
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['message' => 'Lead deleted successfully']);
    exit;
}
