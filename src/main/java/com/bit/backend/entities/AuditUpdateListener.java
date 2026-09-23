package com.bit.backend.entities;

import com.bit.backend.config.SecurityUtils;
import jakarta.persistence.PreUpdate;

import java.time.LocalDateTime;

public class AuditUpdateListener {

    @PreUpdate
    public void onPreUpdate(Object entity) {
        if (entity instanceof AuditableEntity auditable) {
            auditable.setUpdatedDate(LocalDateTime.now());
            auditable.setUpdatedBy(SecurityUtils.getCurrentUserId());
        }
    }
}
