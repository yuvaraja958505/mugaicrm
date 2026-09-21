-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 21, 2026 at 08:25 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mugai`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `punch_in_time` time DEFAULT NULL,
  `punch_in_image` varchar(255) DEFAULT NULL,
  `punch_out_time` time DEFAULT NULL,
  `punch_out_image` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `punch_in_time`, `punch_in_image`, `punch_out_time`, `punch_out_image`, `notes`, `created_at`) VALUES
(1, 1, '2026-09-20', '18:07:48', 'uploads/attendance/punch_in_1_1789920468_7652.jpeg', NULL, NULL, '', '2026-09-20 16:07:48');

-- --------------------------------------------------------

--
-- Table structure for table `business_domains`
--

CREATE TABLE `business_domains` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `business_domains`
--

INSERT INTO `business_domains` (`id`, `name`, `description`, `status`, `created_at`) VALUES
(5, 'Production / Manufacturing', '', 'active', '2026-09-20 17:32:11'),
(6, 'Boutique', '', 'active', '2026-09-20 17:32:32'),
(7, 'EdTech', '', 'active', '2026-09-20 17:32:43');

-- --------------------------------------------------------

--
-- Table structure for table `cities`
--

CREATE TABLE `cities` (
  `id` int(11) NOT NULL,
  `state_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cities`
--

INSERT INTO `cities` (`id`, `state_id`, `name`, `status`, `created_at`) VALUES
(1, 1, 'Coimbatore', 'active', '2026-09-20 17:33:56');

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `mobile` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contacts`
--

INSERT INTO `contacts` (`id`, `name`, `mobile`, `description`, `created_at`) VALUES
(1, 'Ajay A', '6380338626', 'Lead: Techinta (Meta Ads)', '2026-09-20 18:23:56'),
(3, 'AJAY A', '6380304683', 'Yest', '2026-09-20 18:28:06'),
(5, 'AJAY A', '7708190822', 'Lead: Techinta (Meta Ads)', '2026-09-21 05:25:56');

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE `countries` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`id`, `name`, `code`, `status`, `created_at`) VALUES
(1, 'India', 'IN', 'active', '2026-09-20 17:33:31');

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact` varchar(50) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `business_name` varchar(150) NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `domain_id` int(11) DEFAULT NULL,
  `interested_domain` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city_id` int(11) DEFAULT NULL,
  `required_services` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`required_services`)),
  `expected_budget` decimal(12,2) DEFAULT 0.00,
  `company_budget` decimal(12,2) DEFAULT 0.00,
  `closed_budget` decimal(12,2) DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `next_followup_required` tinyint(1) DEFAULT 0,
  `next_followup_date` date DEFAULT NULL,
  `next_followup_time` time DEFAULT NULL,
  `status` enum('New','In Progress','Follow-Up Scheduled','Won','Lost') DEFAULT 'New',
  `lead_source` varchar(100) DEFAULT NULL,
  `lead_owner_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `name`, `contact`, `email`, `business_name`, `website`, `domain_id`, `interested_domain`, `address`, `city_id`, `required_services`, `expected_budget`, `company_budget`, `closed_budget`, `notes`, `next_followup_required`, `next_followup_date`, `next_followup_time`, `status`, `lead_source`, `lead_owner_id`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Ajay A', '6380338626', 'ajay@techinta.com', 'Techinta', 'www.techinta.com', 7, 'www.techinta.com', '7/110 Ruby School Road', 1, '[\"Landing Page\",\"Require admin panel\"]', 58000.00, 60000.00, 590000.00, '[2026-09-20 08:47 PM - System Administrator]\nNext meeting need to close\n\n-------------------\n\n[2026-09-20 08:47 PM - System Administrator]\nTesting part one\n\n-------------------\n\nTesting', 1, '2026-09-21', '20:10:00', 'Won', 'Meta Ads', 1, 1, '2026-09-20 18:23:56', '2026-09-20 18:47:46'),
(2, 'AJAY A', '7708190822', 'info@techinta.com', 'Techinta', 'www.techinta.com', 7, 'mugaitech.in', '7/110 RUBY SCHOOL ROAD', 1, '[\"Landing Page\",\"Require admin panel\"]', 12000.00, 15000.00, 13000.00, '[2026-09-21 07:26 AM - Alex Sales Executive]\nTest', 0, NULL, NULL, 'New', 'Meta Ads', 2, 2, '2026-09-21 05:25:56', '2026-09-21 05:26:48');

-- --------------------------------------------------------

--
-- Table structure for table `lead_followups`
--

CREATE TABLE `lead_followups` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `followup_date` date DEFAULT NULL,
  `followup_time` time DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lead_followups`
--

INSERT INTO `lead_followups` (`id`, `lead_id`, `followup_date`, `followup_time`, `notes`, `status`, `created_by`, `created_at`) VALUES
(1, 1, '2026-09-21', '20:10:00', 'Testing part one', 'Follow-Up Scheduled', 1, '2026-09-20 18:47:04'),
(2, 1, '2026-09-21', '20:10:00', 'Next meeting need to close', 'Won', 1, '2026-09-20 18:47:46'),
(3, 2, NULL, NULL, 'Test', 'New', 2, '2026-09-21 05:26:48');

-- --------------------------------------------------------

--
-- Table structure for table `meetings`
--

CREATE TABLE `meetings` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `venue` varchar(100) DEFAULT 'Client location',
  `location` text DEFAULT NULL,
  `all_day` tinyint(1) DEFAULT 0,
  `from_datetime` datetime NOT NULL,
  `to_datetime` datetime NOT NULL,
  `host_id` int(11) DEFAULT NULL,
  `host_name` varchar(255) DEFAULT NULL,
  `participants` text DEFAULT NULL,
  `related_to` varchar(100) DEFAULT 'None',
  `related_id` int(11) DEFAULT NULL,
  `repeat_frequency` varchar(50) DEFAULT 'None',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `meetings`
--

INSERT INTO `meetings` (`id`, `title`, `venue`, `location`, `all_day`, `from_datetime`, `to_datetime`, `host_id`, `host_name`, `participants`, `related_to`, `related_id`, `repeat_frequency`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Website Development', 'Online', 'Gmeet', 0, '2026-09-21 15:00:00', '2026-09-21 16:00:00', 1, 'System Administrator', 'None', 'Lead', NULL, 'None', '', '2026-09-20 19:35:06', '2026-09-20 19:35:06');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `description`, `status`, `created_at`) VALUES
(1, 'Landing Page', '', 'active', '2026-09-20 17:32:53'),
(2, 'Require admin panel', '', 'active', '2026-09-20 17:33:20');

-- --------------------------------------------------------

--
-- Table structure for table `states`
--

CREATE TABLE `states` (
  `id` int(11) NOT NULL,
  `country_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `states`
--

INSERT INTO `states` (`id`, `country_id`, `name`, `status`, `created_at`) VALUES
(1, 1, 'Tamil Nadu', 'active', '2026-09-20 17:33:42');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `task_owner_id` int(11) DEFAULT NULL,
  `task_owner_name` varchar(255) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `due_date` date DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `account_name` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Not Started',
  `priority` varchar(50) DEFAULT 'High',
  `reminder` tinyint(1) DEFAULT 0,
  `repeat_task` tinyint(1) DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','sales','developer','ui_ux') NOT NULL DEFAULT 'sales',
  `full_name` varchar(100) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  `token_expires` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `full_name`, `token`, `token_expires`, `created_at`) VALUES
(1, 'admin', '$2y$10$DjiOEUDOAaGbNtm.d0fNpO45YQ7I.QUv7BAv5PzSO2lAXXrYDmiLC', 'admin', 'System Administrator', 'e9acb3a0e9b2a7e2f39aab6b78bdf72c2deb3ed37344d62be92d91ae5d3766be', '2026-09-21 19:46:15', '2026-09-19 17:43:43'),
(2, 'sales_pro', '$2y$10$KoXRZQYb0BPWcL6QkM98deTvJSCWUPndIm33H0A13A/7sXSTSREXG', 'sales', 'Alex Sales Executive', '7c65472fbbec094139c6d7d8e6ad2a033be63a8ce58d09ab104ec4e47ff7ec55', '2026-09-22 07:18:35', '2026-09-19 17:43:43'),
(3, 'dev_lead', '$2y$10$6En0MgWRwgKe2zh154JwnOUnGNa5sP7MLc80gxnVGrWjsq1SbMkPi', 'developer', 'John Developer', NULL, NULL, '2026-09-19 17:43:43'),
(4, 'ui_designer', '$2y$10$q3Wx0uiprHX0dNdcQJZCRePnyfWc5p5cjeTpjOYPxRkTZW8JyQp7e', 'ui_ux', 'Sarah UI/UX Specialist', '4ef80febc7af51d34f7af66e07f186721e1e64bbc127584e75c5eea8c3ed7ab5', '2026-09-21 18:53:40', '2026-09-19 17:43:43');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL,
  `role_key` varchar(50) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `role_key`, `role_name`, `description`, `permissions`, `created_at`) VALUES
(1, 'admin', 'Administrator', 'Full system control, General Master, and User management access', NULL, '2026-09-20 15:48:43'),
(2, 'sales', 'Sales Representative', 'Access to Lead Master, Pipeline tracking, and Attendance', NULL, '2026-09-20 15:48:43'),
(3, 'developer', 'Software Developer', 'Access to Dashboard, Leads view, and Attendance', NULL, '2026-09-20 15:48:43'),
(4, 'ui_ux', 'UI/UX Specialist', 'Access to Dashboard, Leads view, and Attendance', NULL, '2026-09-20 15:48:43');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_date` (`user_id`,`attendance_date`);

--
-- Indexes for table `business_domains`
--
ALTER TABLE `business_domains`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `cities`
--
ALTER TABLE `cities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `state_id` (`state_id`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mobile` (`mobile`);

--
-- Indexes for table `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `domain_id` (`domain_id`),
  ADD KEY `city_id` (`city_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `lead_followups`
--
ALTER TABLE `lead_followups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lead_id` (`lead_id`);

--
-- Indexes for table `meetings`
--
ALTER TABLE `meetings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `states`
--
ALTER TABLE `states`
  ADD PRIMARY KEY (`id`),
  ADD KEY `country_id` (`country_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_key` (`role_key`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `business_domains`
--
ALTER TABLE `business_domains`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `cities`
--
ALTER TABLE `cities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `countries`
--
ALTER TABLE `countries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `lead_followups`
--
ALTER TABLE `lead_followups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `meetings`
--
ALTER TABLE `meetings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `states`
--
ALTER TABLE `states`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cities`
--
ALTER TABLE `cities`
  ADD CONSTRAINT `cities_ibfk_1` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`domain_id`) REFERENCES `business_domains` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leads_ibfk_2` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `leads_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `lead_followups`
--
ALTER TABLE `lead_followups`
  ADD CONSTRAINT `lead_followups_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `states`
--
ALTER TABLE `states`
  ADD CONSTRAINT `states_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
