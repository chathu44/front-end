package com.bit.backend.repositories;

import com.bit.backend.entities.StatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StatusRepository extends JpaRepository<StatusEntity, Long> {
    Optional<StatusEntity> findByName(String name);
}
