package com.bit.backend.repositories;

import com.bit.backend.entities.Privilege;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PrivilegeRepository extends JpaRepository<Privilege, Long> {
    Optional<Privilege> findByAuthId(int authId);
}
