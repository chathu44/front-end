-- Run once if admin has no permissions (empty auth IDs after login).
-- MySQL: USE ems; SOURCE seed-admin-privileges.sql;

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
