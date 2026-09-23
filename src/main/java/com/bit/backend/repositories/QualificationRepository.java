package com.bit.backend.repositories;

import com.bit.backend.entities.QualificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QualificationRepository extends JpaRepository<QualificationEntity, Long> {
    boolean existsByQualificationNameIgnoreCase(String qualificationName);
    Optional<QualificationEntity> findByQualificationNameIgnoreCase(String qualificationName);
}
