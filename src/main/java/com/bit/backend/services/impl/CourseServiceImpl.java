package com.bit.backend.services.impl;

import com.bit.backend.dtos.CourseDto;
import com.bit.backend.entities.CourseEntity;
import com.bit.backend.exceptions.AppException;
import com.bit.backend.mappers.AcademicMapper;
import com.bit.backend.repositories.CourseRepository;
import com.bit.backend.services.CourseServiceI;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CourseServiceImpl implements CourseServiceI {

    private final CourseRepository courseRepository;
    private final AcademicMapper academicMapper;

    public CourseServiceImpl(CourseRepository courseRepository, AcademicMapper academicMapper) {
        this.courseRepository = courseRepository;
        this.academicMapper = academicMapper;
    }

    @Override
    @Transactional
    public CourseDto addCourse(CourseDto courseDto) {
        if (courseDto.getCourseName() == null || courseDto.getCourseName().isBlank()) {
            throw new AppException("Course name is required", HttpStatus.BAD_REQUEST);
        }
        CourseEntity entity = academicMapper.toCourseEntity(courseDto);
        entity.setId(null);
        CourseEntity saved = courseRepository.save(entity);
        if (saved.getCourseCode() == null || saved.getCourseCode().isBlank()) {
            saved.setCourseCode("CRS-" + saved.getId());
            saved = courseRepository.save(saved);
        }
        return academicMapper.toCourseDto(saved);
    }

    @Override
    public List<CourseDto> getAllCourses() {
        return academicMapper.toCourseDtoList(courseRepository.findAll());
    }

    @Override
    public CourseDto getCourseById(long id) {
        return academicMapper.toCourseDto(courseRepository.findById(id)
                .orElseThrow(() -> new AppException("Course not found", HttpStatus.NOT_FOUND)));
    }

    @Override
    @Transactional
    public CourseDto updateCourse(long id, CourseDto courseDto) {
        CourseEntity existing = courseRepository.findById(id)
                .orElseThrow(() -> new AppException("Course not found", HttpStatus.NOT_FOUND));
        if (courseDto.getCourseName() == null || courseDto.getCourseName().isBlank()) {
            throw new AppException("Course name is required", HttpStatus.BAD_REQUEST);
        }
        existing.setCourseName(courseDto.getCourseName());
        if (courseDto.getCourseCode() != null && !courseDto.getCourseCode().isBlank()) {
            existing.setCourseCode(courseDto.getCourseCode());
        }
        return academicMapper.toCourseDto(courseRepository.save(existing));
    }

    @Override
    @Transactional
    public CourseDto deleteCourse(long id) {
        CourseEntity existing = courseRepository.findById(id)
                .orElseThrow(() -> new AppException("Course not found", HttpStatus.NOT_FOUND));
        CourseDto dto = academicMapper.toCourseDto(existing);
        courseRepository.delete(existing);
        return dto;
    }
}
