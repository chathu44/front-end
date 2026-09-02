package com.bit.backend.repositories;

import com.bit.backend.entities.User;
import jakarta.persistence.Tuple;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByLogin(String login);

    /**
     * Returns privilege (auth) IDs for a user from active privilege groups only.
     */
    @Query(nativeQuery = true, value = """
            SELECT DISTINCT aga.auth_id
            FROM auth_group_users agu
            INNER JOIN auth_groups ag ON ag.id = agu.auth_group_id AND ag.status = 1
            INNER JOIN auth_group_authentication aga ON aga.auth_group_id = agu.auth_group_id
            WHERE agu.user_id = :userId
            """)
    List<Integer> findAuthIdsByUserId(@Param("userId") long userId);

    @Query(nativeQuery = true, value = """
            SELECT auth_id AS id, auth_description AS description
            FROM system_authentications
            WHERE assigned = 0
            """)
    List<Tuple> getAvailableSystemPrivileges();

    @Query(nativeQuery = true, value = """
            SELECT auth_id AS id, auth_description AS description
            FROM system_authentications
            WHERE assigned = 1
            """)
    List<Tuple> getAssignedSystemPrivileges();
}
