<?php
require_once __DIR__ . '/../config/db.php';

try {
    $pdo->exec("
        ALTER TABLE `leads`
        ADD COLUMN IF NOT EXISTS `lead_owner_id` INT NULL AFTER `status`,
        ADD COLUMN IF NOT EXISTS `email` VARCHAR(150) NULL AFTER `contact`,
        ADD COLUMN IF NOT EXISTS `website` VARCHAR(255) NULL AFTER `business_name`,
        ADD COLUMN IF NOT EXISTS `interested_domain` VARCHAR(150) NULL AFTER `domain_id`,
        ADD COLUMN IF NOT EXISTS `lead_source` VARCHAR(100) NULL AFTER `status`;
    ");
    
    // Set lead_owner_id to created_by if null
    $pdo->exec("UPDATE `leads` SET `lead_owner_id` = `created_by` WHERE `lead_owner_id` IS NULL AND `created_by` IS NOT NULL;");

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration Error: " . $e->getMessage() . "\n";
}
