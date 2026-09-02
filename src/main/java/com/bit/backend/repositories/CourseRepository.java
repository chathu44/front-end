package com.bit.backend.repositories;

import com.bit.backend.entities.CourseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CourseRepository extends JpaRepository<CourseEntity, Long> {
    Optional<CourseEntity> findByCourseName(String courseName);
}
