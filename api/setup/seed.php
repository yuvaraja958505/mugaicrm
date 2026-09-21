<?php
require_once __DIR__ . '/../config/db.php';

echo "Setting up Mugai database tables...\n";

$sql = file_get_contents(__DIR__ . '/schema.sql');
$pdo->exec($sql);

echo "Database tables created successfully!\n";

// Seed Users
$users = [
    [
        'username' => 'admin',
        'password' => 'Admin@123',
        'role' => 'admin',
        'full_name' => 'System Administrator'
    ],
    [
        'username' => 'sales_pro',
        'password' => 'Sales@123',
        'role' => 'sales',
        'full_name' => 'Alex Sales Executive'
    ],
    [
        'username' => 'dev_lead',
        'password' => 'Dev@123',
        'role' => 'developer',
        'full_name' => 'John Developer'
    ],
    [
        'username' => 'ui_designer',
        'password' => 'Ui@123',
        'role' => 'ui_ux',
        'full_name' => 'Sarah UI/UX Specialist'
    ]
];

foreach ($users as $u) {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$u['username']]);
    if (!$stmt->fetch()) {
        $hash = password_hash($u['password'], PASSWORD_BCRYPT);
        $insert = $pdo->prepare("INSERT INTO users (username, password_hash, role, full_name) VALUES (?, ?, ?, ?)");
        $insert->execute([$u['username'], $hash, $u['role'], $u['full_name']]);
        echo "Seeded user: {$u['username']} ({$u['role']})\n";
    }
}

// Seed Business Domains
$domains = ['FinTech & Banking', 'E-Commerce & Retail', 'Healthcare & Pharma', 'Real Estate & Construction', 'EdTech & E-Learning', 'Logistics & Supply Chain'];
foreach ($domains as $d) {
    $stmt = $pdo->prepare("SELECT id FROM business_domains WHERE name = ?");
    $stmt->execute([$d]);
    if (!$stmt->fetch()) {
        $pdo->prepare("INSERT INTO business_domains (name, description) VALUES (?, ?)")->execute([$d, "Enterprise solution domain for $d"]);
    }
}

// Seed Services
$services = ['Custom Web Application', 'Mobile App Development (iOS/Android)', 'UI/UX Design & Prototyping', 'Cloud Infrastructure & DevOps', 'AI & Machine Learning Integration', 'API & Third-Party Integration'];
foreach ($services as $s) {
    $stmt = $pdo->prepare("SELECT id FROM services WHERE name = ?");
    $stmt->execute([$s]);
    if (!$stmt->fetch()) {
        $pdo->prepare("INSERT INTO services (name, description) VALUES (?, ?)")->execute([$s, "Professional service offering: $s"]);
    }
}

// Seed Countries, States, Cities
$countriesData = [
    'India' => [
        'Tamil Nadu' => ['Chennai', 'Coimbatore', 'Madurai'],
        'Karnataka' => ['Bengaluru', 'Mysuru', 'Mangaluru'],
        'Maharashtra' => ['Mumbai', 'Pune', 'Nagpur']
    ],
    'United States' => [
        'California' => ['San Francisco', 'Los Angeles', 'San Jose'],
        'New York' => ['New York City', 'Buffalo', 'Albany'],
        'Texas' => ['Austin', 'Houston', 'Dallas']
    ],
    'United Arab Emirates' => [
        'Dubai' => ['Dubai City'],
        'Abu Dhabi' => ['Abu Dhabi City']
    ]
];

foreach ($countriesData as $cName => $states) {
    $stmt = $pdo->prepare("SELECT id FROM countries WHERE name = ?");
    $stmt->execute([$cName]);
    $cRow = $stmt->fetch();
    if (!$cRow) {
        $pdo->prepare("INSERT INTO countries (name, code) VALUES (?, ?)")->execute([$cName, strtoupper(substr($cName, 0, 3))]);
        $cId = $pdo->lastInsertId();
    } else {
        $cId = $cRow['id'];
    }

    foreach ($states as $sName => $cities) {
        $stmt = $pdo->prepare("SELECT id FROM states WHERE name = ? AND country_id = ?");
        $stmt->execute([$sName, $cId]);
        $sRow = $stmt->fetch();
        if (!$sRow) {
            $pdo->prepare("INSERT INTO states (country_id, name) VALUES (?, ?)")->execute([$cId, $sName]);
            $sId = $pdo->lastInsertId();
        } else {
            $sId = $sRow['id'];
        }

        foreach ($cities as $cityName) {
            $stmt = $pdo->prepare("SELECT id FROM cities WHERE name = ? AND state_id = ?");
            $stmt->execute([$cityName, $sId]);
            if (!$stmt->fetch()) {
                $pdo->prepare("INSERT INTO cities (state_id, name) VALUES (?, ?)")->execute([$sId, $cityName]);
            }
        }
    }
}

// Seed Sample Lead
$leadStmt = $pdo->query("SELECT COUNT(*) FROM leads");
if ($leadStmt->fetchColumn() == 0) {
    $pdo->prepare("INSERT INTO leads (name, contact, business_name, domain_id, address, city_id, required_services, expected_budget, company_budget, closed_budget, notes, next_followup_required, next_followup_date, status) VALUES (?, ?, ?, 1, ?, 1, ?, 150000, 140000, 145000, ?, 1, ?, ?)")
        ->execute([
            'Robert Johnson',
            '+1 555 019 2831',
            'FinServe Solutions',
            '100 Wall Street, Suite 400',
            json_encode(['Custom Web Application', 'UI/UX Design & Prototyping']),
            'Client interested in modular ERP dashboard and mobile client app.',
            date('Y-m-d', strtotime('+3 days')),
            'In Progress'
        ]);
}

echo "Seeding completed successfully!\n";
