<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';

$user = authenticateToken($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = intval($user['id']);
    $isAdmin = ($user['role'] === 'admin');

    $whereClause = $isAdmin ? "" : " WHERE (lead_owner_id = $userId OR created_by = $userId)";
    $andClause   = $isAdmin ? "" : " AND (lead_owner_id = $userId OR created_by = $userId)";
    $leadAliasWhere = $isAdmin ? "" : " AND (l.lead_owner_id = $userId OR l.created_by = $userId)";

    // 1. Total Leads Count
    $totalLeads = (int)$pdo->query("SELECT COUNT(*) FROM leads $whereClause")->fetchColumn();

    // 2. Status counts
    $newLeads = (int)$pdo->query("SELECT COUNT(*) FROM leads WHERE status = 'New' $andClause")->fetchColumn();
    $inProgressLeads = (int)$pdo->query("SELECT COUNT(*) FROM leads WHERE status = 'In Progress' $andClause")->fetchColumn();
    $followupScheduled = (int)$pdo->query("SELECT COUNT(*) FROM leads WHERE status = 'Follow-Up Scheduled' $andClause")->fetchColumn();
    $wonLeads = (int)$pdo->query("SELECT COUNT(*) FROM leads WHERE status = 'Won' $andClause")->fetchColumn();
    $lostLeads = (int)$pdo->query("SELECT COUNT(*) FROM leads WHERE status = 'Lost' $andClause")->fetchColumn();
    $notInterestedLeads = (int)$pdo->query("SELECT COUNT(*) FROM leads WHERE status = 'Not Interested' $andClause")->fetchColumn();

    // 3. Pipeline & Revenue values
    $pipelineValue = (float)$pdo->query("SELECT SUM(expected_budget) FROM leads $whereClause")->fetchColumn() ?: 0.00;
    $wonValue = (float)$pdo->query("SELECT SUM(closed_budget) FROM leads WHERE status = 'Won' $andClause")->fetchColumn() ?: 0.00;

    // 4. Lead Source breakdown
    $sourceStmt = $pdo->query("SELECT IFNULL(NULLIF(lead_source, ''), 'Unspecified') as source, COUNT(*) as count FROM leads $whereClause GROUP BY lead_source ORDER BY count DESC");
    $leadSources = $sourceStmt->fetchAll();

    // 5. Upcoming Follow-Ups (limit 6)
    $followupSql = "SELECT l.id, l.name, l.contact, l.business_name, l.status, 
                           l.next_followup_date, l.next_followup_time, l.notes
                    FROM leads l
                    WHERE (l.next_followup_required = 1 OR l.next_followup_date IS NOT NULL) $leadAliasWhere
                    ORDER BY l.next_followup_date ASC, l.next_followup_time ASC
                    LIMIT 6";
    $upcomingFollowups = $pdo->query($followupSql)->fetchAll();

    // 5b. Reminder Follow-Ups (Scheduled for Today, Tomorrow - 1 Day Before, or Overdue)
    $reminderSql = "SELECT l.id, l.name, l.contact, l.email, l.business_name, l.status, 
                           l.next_followup_date, l.next_followup_time, l.notes,
                           owner.full_name as owner_name,
                           CASE 
                             WHEN l.next_followup_date = CURDATE() THEN 'Today'
                             WHEN l.next_followup_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 'Tomorrow (1 Day Before)'
                             WHEN l.next_followup_date < CURDATE() THEN 'Overdue'
                             ELSE 'Upcoming'
                           END AS due_badge
                    FROM leads l
                    LEFT JOIN users owner ON l.lead_owner_id = owner.id
                    WHERE (l.next_followup_required = 1 OR l.next_followup_date IS NOT NULL)
                      AND l.next_followup_date <= DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                      AND l.status NOT IN ('Won', 'Lost', 'Not Interested')
                      $leadAliasWhere
                    ORDER BY l.next_followup_date ASC, l.next_followup_time ASC";
    $reminderFollowups = $pdo->query($reminderSql)->fetchAll();

    // 6. Recent Leads (limit 6)
    $recentLeadsSql = "SELECT l.id, l.name, l.contact, l.business_name, l.status, l.expected_budget, l.created_at, owner.full_name as owner_name
                       FROM leads l
                       LEFT JOIN users owner ON l.lead_owner_id = owner.id
                       WHERE 1=1 $leadAliasWhere
                       ORDER BY l.id DESC
                       LIMIT 6";
    $recentLeads = $pdo->query($recentLeadsSql)->fetchAll();

    // 7. Pending Tasks Count
    $taskWhere = $isAdmin ? "" : " WHERE task_owner_id = $userId";
    $pendingTasks = (int)$pdo->query("SELECT COUNT(*) FROM tasks WHERE status != 'Completed' " . ($isAdmin ? "" : " AND task_owner_id = $userId"))->fetchColumn();

    // 8. Today's Meetings Count
    $meetingWhere = $isAdmin ? "" : " AND host_id = $userId";
    $todayMeetings = (int)$pdo->query("SELECT COUNT(*) FROM meetings WHERE DATE(from_datetime) = CURDATE() $meetingWhere")->fetchColumn();

    echo json_encode([
        'data' => [
            'metrics' => [
                'total_leads' => $totalLeads,
                'new_leads' => $newLeads,
                'in_progress_leads' => $inProgressLeads,
                'followup_scheduled' => $followupScheduled,
                'won_leads' => $wonLeads,
                'lost_leads' => $lostLeads,
                'not_interested_leads' => $notInterestedLeads,
                'pipeline_value' => $pipelineValue,
                'won_value' => $wonValue,
                'pending_tasks' => $pendingTasks,
                'today_meetings' => $todayMeetings,
            ],
            'lead_sources' => $leadSources,
            'upcoming_followups' => $upcomingFollowups,
            'reminder_followups' => $reminderFollowups,
            'recent_leads' => $recentLeads,
        ]
    ]);
    exit;
}
