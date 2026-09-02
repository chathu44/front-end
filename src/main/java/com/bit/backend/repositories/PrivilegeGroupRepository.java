package com.bit.backend.repositories;

import com.bit.backend.entities.PrivilegeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PrivilegeGroupRepository extends JpaRepository<PrivilegeGroup, Long> {

    @Query(nativeQuery = true, value = "SELECT * FROM auth_groups WHERE status = 1")
    List<PrivilegeGroup> getActivePrivilegeGroups();

    @Query(nativeQuery = true, value = "SELECT * FROM auth_groups WHERE id != :id AND group_name = :name AND status = 1")
    List<PrivilegeGroup> findByIdAndName(@Param("id") long id, @Param("name") String name);

    @Query(nativeQuery = true, value = "SELECT * FROM auth_groups WHERE group_name = :name AND status = 1")
    List<PrivilegeGroup> findByGroupNameAndStatus(@Param("name") String name);
}
