package com.bit.backend.repositories;

import com.bit.backend.entities.Parent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParentRepository extends JpaRepository<Parent, Long> {
}
