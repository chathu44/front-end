package com.bit.backend.repositories;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Tuple;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Native SQL helpers for privilege-group dual-list screens.
 * Uses plain JOINs (no MySQL views required).
 */
@Repository
public class CommonDataRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<Tuple> getAvailablePrivilegesByGroupId(int groupId) {
        return entityManager.createNativeQuery("""
                SELECT sys_auth.auth_id AS id, sys_auth.auth_description AS description
                FROM system_authentications sys_auth
                LEFT JOIN auth_group_authentication auth_group
                    ON sys_auth.auth_id = auth_group.auth_id AND auth_group.auth_group_id = :groupId
                WHERE sys_auth.assigned = 1 AND auth_group.auth_id IS NULL
                """, Tuple.class)
                .setParameter("groupId", groupId)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Tuple> getAssignedPrivilegesByGroupId(int groupId) {
        return entityManager.createNativeQuery("""
                SELECT aga.auth_id AS id, sa.auth_description AS description
                FROM auth_group_authentication aga
                INNER JOIN system_authentications sa ON sa.auth_id = aga.auth_id
                WHERE aga.auth_group_id = :groupId
                """, Tuple.class)
                .setParameter("groupId", groupId)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Tuple> getAvailableUsersByGroupID(int groupId) {
        return entityManager.createNativeQuery("""
                SELECT users.id AS id, CONCAT(users.first_name, ' ', users.last_name) AS description
                FROM app_user users
                LEFT JOIN auth_group_users auth_group
                    ON users.id = auth_group.user_id AND auth_group.auth_group_id = :groupId
                WHERE auth_group.auth_group_id IS NULL
                """, Tuple.class)
                .setParameter("groupId", groupId)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Tuple> getAssignedUsersByGroupId(int groupId) {
        return entityManager.createNativeQuery("""
                SELECT u.id AS id, CONCAT(u.first_name, ' ', u.last_name) AS description
                FROM auth_group_users agu
                INNER JOIN app_user u ON u.id = agu.user_id
                WHERE agu.auth_group_id = :groupId
                """, Tuple.class)
                .setParameter("groupId", groupId)
                .getResultList();
    }
}
