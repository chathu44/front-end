-- EMS student template schema
-- Run this in MySQL before starting the Spring Boot app:
--   CREATE DATABASE IF NOT EXISTS ems;
--   USE ems;
--   SOURCE schema.sql;

CREATE TABLE IF NOT EXISTS app_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    login VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_date DATETIME,
    created_by BIGINT,
    updated_date DATETIME NULL,
    updated_by BIGINT NULL
);

CREATE TABLE IF NOT EXISTS system_authentications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    auth_id INT NOT NULL UNIQUE,
    auth_description VARCHAR(255) NOT NULL,
    assigned INT NOT NULL DEFAULT 0,
    created_date DATETIME,
    created_by BIGINT,
    updated_date DATETIME NULL,
    updated_by BIGINT NULL
);

CREATE TABLE IF NOT EXISTS auth_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    group_description VARCHAR(255),
    status INT NOT NULL DEFAULT 1,
    created_date DATETIME,
    created_by BIGINT,
    updated_date DATETIME NULL,
    updated_by BIGINT NULL
);

CREATE TABLE IF NOT EXISTS auth_group_authentication (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    auth_group_id INT NOT NULL,
    auth_id INT NOT NULL,
    created_date DATETIME,
    created_by BIGINT,
    updated_date DATETIME NULL,
    updated_by BIGINT NULL
);

CREATE TABLE IF NOT EXISTS auth_group_users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    auth_group_id INT NOT NULL,
    user_id INT NOT NULL,
    created_date DATETIME,
    created_by BIGINT,
    updated_date DATETIME NULL,
    updated_by BIGINT NULL
);

CREATE TABLE IF NOT EXISTS status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_date DATETIME,
    created_by BIGINT,
    updated_date DATETIME NULL,
    updated_by BIGINT NULL
);

CREATE TABLE IF NOT EXISTS student (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(50),
    student_name VARCHAR(150) NOT NULL,
    student_age VARCHAR(20),
    student_nic VARCHAR(50),
    status_id BIGINT NOT NULL,
    created_date DATETIME,
    created_by BIGINT,
    updated_date DATETIME NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_student_status FOREIGN KEY (status_id) REFERENCES status(id)
);

CREATE TABLE IF NOT EXISTS course (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(50),
    course_name VARCHAR(150) NOT NULL,
    created_date DATETIME,
    created_by BIGINT,
    updated_date DATETIME NULL,
    updated_by BIGINT NULL
);

CREATE TABLE IF NOT EXISTS qualification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    qualification_name VARCHAR(150) NOT NULL UNIQUE,
    created_date DATETIME,
    created_by BIGINT,
    updated_date DATETIME NULL,
    updated_by BIGINT NULL
);

CREATE TABLE IF NOT EXISTS teacher (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    teacher_code VARCHAR(50),
    teacher_name VARCHAR(150) NOT NULL,
    course_id BIGINT NOT NULL,
    qualification_id BIGINT NOT NULL,
    created_date DATETIME,
    created_by BIGINT,
    updated_date DATETIME NULL,
    updated_by BIGINT NULL,
    CONSTRAINT fk_teacher_course FOREIGN KEY (course_id) REFERENCES course(id),
    CONSTRAINT fk_teacher_qualification FOREIGN KEY (qualification_id) REFERENCES qualification(id)
);

CREATE TABLE IF NOT EXISTS login_log (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    user_type VARCHAR(10) NOT NULL,
    login_time DATETIME NOT NULL,
    logout_time DATETIME NULL,
    ip_address VARCHAR(45) NULL
);

-- Sample privileges (auth_id is the business key used by the UI / button checks)
INSERT INTO system_authentications (auth_id, auth_description, assigned)
SELECT * FROM (
    SELECT 1 AS auth_id, 'USER_VIEW' AS auth_description, 1 AS assigned UNION ALL
    SELECT 2, 'USER_CREATE', 1 UNION ALL
    SELECT 3, 'USER_UPDATE', 1 UNION ALL
    SELECT 4, 'USER_DELETE', 0 UNION ALL
    SELECT 5, 'MENU_DASHBOARD', 1 UNION ALL
    SELECT 6, 'MENU_PERMISSION', 1 UNION ALL
    SELECT 7, 'BUTTON_SAVE', 1 UNION ALL
    SELECT 8, 'BUTTON_DELETE', 0 UNION ALL
    SELECT 10, 'STUDENT_VIEW', 1 UNION ALL
    SELECT 11, 'STUDENT_CREATE', 1 UNION ALL
    SELECT 12, 'STUDENT_UPDATE', 1 UNION ALL
    SELECT 13, 'STUDENT_DELETE', 1 UNION ALL
    SELECT 20, 'COURSE_VIEW', 1 UNION ALL
    SELECT 21, 'COURSE_CREATE', 1 UNION ALL
    SELECT 22, 'COURSE_UPDATE', 1 UNION ALL
    SELECT 23, 'COURSE_DELETE', 1 UNION ALL
    SELECT 30, 'TEACHER_VIEW', 1 UNION ALL
    SELECT 31, 'TEACHER_CREATE', 1 UNION ALL
    SELECT 32, 'TEACHER_UPDATE', 1 UNION ALL
    SELECT 33, 'TEACHER_DELETE', 1
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM system_authentications LIMIT 1);

INSERT INTO status (name)
SELECT * FROM (
    SELECT 'Active' AS name UNION ALL
    SELECT 'Inactive' UNION ALL
    SELECT 'Pending'
) AS status_seed
WHERE NOT EXISTS (SELECT 1 FROM status LIMIT 1);

INSERT INTO qualification (qualification_name)
SELECT * FROM (
    SELECT 'Bachelor' AS qualification_name UNION ALL
    SELECT 'Master' UNION ALL
    SELECT 'PhD' UNION ALL
    SELECT 'Diploma'
) AS qualification_seed
WHERE NOT EXISTS (SELECT 1 FROM qualification LIMIT 1);

-- Default admin user password is: password
-- BCrypt hash for "password"
INSERT INTO app_user (first_name, last_name, login, password)
SELECT 'System', 'Admin', 'admin', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG'
WHERE NOT EXISTS (SELECT 1 FROM app_user WHERE login = 'admin');

-- Default admin privilege group (required for /get-auth-ids to return IDs)
INSERT INTO auth_groups (group_name, group_description, status)
SELECT 'Administrators', 'Full system access', 1
WHERE NOT EXISTS (SELECT 1 FROM auth_groups WHERE group_name = 'Administrators');

INSERT INTO auth_group_authentication (auth_group_id, auth_id)
SELECT ag.id, sa.auth_id
FROM auth_groups ag
CROSS JOIN system_authentications sa
WHERE ag.group_name = 'Administrators'
  AND NOT EXISTS (
    SELECT 1 FROM auth_group_authentication existing
    WHERE existing.auth_group_id = ag.id AND existing.auth_id = sa.auth_id
  );

INSERT INTO auth_group_users (auth_group_id, user_id)
SELECT ag.id, u.id
FROM auth_groups ag
INNER JOIN app_user u ON u.login = 'admin'
WHERE ag.group_name = 'Administrators'
  AND NOT EXISTS (
    SELECT 1 FROM auth_group_users existing
    WHERE existing.auth_group_id = ag.id AND existing.user_id = u.id
  );
