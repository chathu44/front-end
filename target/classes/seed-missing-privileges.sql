-- Add missing privilege rows to system_authentications.
-- Run in MySQL: USE ems; then paste and run.

INSERT INTO system_authentications (auth_id, auth_description, assigned)
SELECT 10, 'STUDENT_VIEW', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_authentications WHERE auth_id = 10);

INSERT INTO system_authentications (auth_id, auth_description, assigned)
SELECT 11, 'STUDENT_CREATE', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_authentications WHERE auth_id = 11);

INSERT INTO system_authentications (auth_id, auth_description, assigned)
SELECT 12, 'STUDENT_UPDATE', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_authentications WHERE auth_id = 12);

INSERT INTO system_authentications (auth_id, auth_description, assigned)
SELECT 13, 'STUDENT_DELETE', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_authentications WHERE auth_id = 13);

INSERT INTO system_authentications (auth_id, auth_description, assigned)
SELECT 7, 'BUTTON_SAVE', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_authentications WHERE auth_id = 7);

INSERT INTO system_authentications (auth_id, auth_description, assigned)
SELECT 8, 'BUTTON_DELETE', 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM system_authentications WHERE auth_id = 8);

-- After inserting, assign new auth_ids to your admin group (example group name: Administrators):
INSERT INTO auth_group_authentication (auth_group_id, auth_id)
SELECT ag.id, sa.auth_id
FROM auth_groups ag
CROSS JOIN system_authentications sa
WHERE ag.group_name = 'Administrators'
  AND sa.auth_id IN (7, 8, 10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33)
  AND NOT EXISTS (
    SELECT 1 FROM auth_group_authentication x
    WHERE x.auth_group_id = ag.id AND x.auth_id = sa.auth_id
  );
