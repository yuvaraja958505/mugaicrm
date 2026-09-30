<?php
require_once __DIR__ . '/../api/config/db.php';

try {
    $colsLeads = $pdo->query("SHOW COLUMNS FROM leads")->fetchAll(PDO::FETCH_COLUMN);
    if (in_array('next_followup_to_date', $colsLeads)) {
        $pdo->exec("ALTER TABLE leads DROP COLUMN next_followup_to_date");
        echo "Dropped next_followup_to_date from leads\n";
    }
    if (in_array('next_followup_to_time', $colsLeads)) {
        $pdo->exec("ALTER TABLE leads DROP COLUMN next_followup_to_time");
        echo "Dropped next_followup_to_time from leads\n";
    }

    $colsFollowups = $pdo->query("SHOW COLUMNS FROM lead_followups")->fetchAll(PDO::FETCH_COLUMN);
    if (in_array('followup_to_date', $colsFollowups)) {
        $pdo->exec("ALTER TABLE lead_followups DROP COLUMN followup_to_date");
        echo "Dropped followup_to_date from lead_followups\n";
    }
    if (in_array('followup_to_time', $colsFollowups)) {
        $pdo->exec("ALTER TABLE lead_followups DROP COLUMN followup_to_time");
        echo "Dropped followup_to_time from lead_followups\n";
    }

    echo "Database table columns dropped successfully!\n";
} catch (\PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
