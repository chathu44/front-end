package com.bit.backend.repositories;

import com.bit.backend.entities.LoginLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoginLogRepository extends JpaRepository<LoginLogEntity, Long> {

    Optional<LoginLogEntity> findTopByUserIdAndLogoutTimeIsNullOrderByLoginTimeDesc(Long userId);
}
