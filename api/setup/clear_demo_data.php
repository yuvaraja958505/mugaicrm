<?php
require_once __DIR__ . '/../config/db.php';

echo "Cleaning demo records from Mugai database...\n";

// Disable foreign key checks temporarily for truncation
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

$tables = ['leads', 'attendance', 'business_domains', 'services', 'cities', 'states', 'countries'];
foreach ($tables as $t) {
    $pdo->exec("TRUNCATE TABLE `$t`");
    echo "Truncated table `$t`\n";
}

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

// Seed User Roles table if not exists
$pdo->exec("CREATE TABLE IF NOT EXISTS `user_roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_key` VARCHAR(50) NOT NULL UNIQUE,
    `role_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `permissions` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$rolesData = [
    ['admin', 'Administrator', 'Full system control, General Master, and User management access'],
    ['sales', 'Sales Representative', 'Access to Lead Master, Pipeline tracking, and Attendance'],
    ['developer', 'Software Developer', 'Access to Dashboard, Leads view, and Attendance'],
    ['ui_ux', 'UI/UX Specialist', 'Access to Dashboard, Leads view, and Attendance']
];

foreach ($rolesData as $r) {
    $stmt = $pdo->prepare("SELECT id FROM user_roles WHERE role_key = ?");
    $stmt->execute([$r[0]]);
    if (!$stmt->fetch()) {
        $pdo->prepare("INSERT INTO user_roles (role_key, role_name, description) VALUES (?, ?, ?)")->execute($r);
    }
}

echo "Database cleaned and User Roles master initialized successfully!\n";
