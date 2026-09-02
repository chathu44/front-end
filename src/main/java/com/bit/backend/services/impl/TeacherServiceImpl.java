package com.bit.backend.services.impl;

import com.bit.backend.dtos.TeacherDto;
import com.bit.backend.entities.CourseEntity;
import com.bit.backend.entities.QualificationEntity;
import com.bit.backend.entities.TeacherEntity;
import com.bit.backend.exceptions.AppException;
import com.bit.backend.mappers.AcademicMapper;
import com.bit.backend.repositories.CourseRepository;
import com.bit.backend.repositories.QualificationRepository;
import com.bit.backend.repositories.TeacherRepository;
import com.bit.backend.services.TeacherServiceI;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeacherServiceImpl implements TeacherServiceI {

    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final QualificationRepository qualificationRepository;
    private final AcademicMapper academicMapper;

    public TeacherServiceImpl(TeacherRepository teacherRepository,
                              CourseRepository courseRepository,
                              QualificationRepository qualificationRepository,
                              AcademicMapper academicMapper) {
        this.teacherRepository = teacherRepository;
        this.courseRepository = courseRepository;
        this.qualificationRepository = qualificationRepository;
        this.academicMapper = academicMapper;
    }

    @Override
    @Transactional
    public TeacherDto addTeacher(TeacherDto teacherDto) {
        if (teacherDto.getTeacherName() == null || teacherDto.getTeacherName().isBlank()) {
            throw new AppException("Teacher name is required", HttpStatus.BAD_REQUEST);
        }
        TeacherEntity entity = academicMapper.toTeacherEntity(teacherDto);
        entity.setId(null);
        entity.setCourse(resolveCourse(teacherDto));
        entity.setQualification(resolveQualification(teacherDto));

        TeacherEntity saved = teacherRepository.save(entity);
        if (saved.getTeacherCode() == null || saved.getTeacherCode().isBlank()) {
            saved.setTeacherCode("TCH-" + saved.getId());
            saved = teacherRepository.save(saved);
        }
        return academicMapper.toTeacherDto(saved);
    }

    @Override
    public List<TeacherDto> getAllTeachers() {
        return academicMapper.toTeacherDtoList(teacherRepository.findAll());
    }

    @Override
    public TeacherDto getTeacherById(long id) {
        return academicMapper.toTeacherDto(teacherRepository.findById(id)
                .orElseThrow(() -> new AppException("Teacher not found", HttpStatus.NOT_FOUND)));
    }

    @Override
    @Transactional
    public TeacherDto updateTeacher(long id, TeacherDto teacherDto) {
        TeacherEntity existing = teacherRepository.findById(id)
                .orElseThrow(() -> new AppException("Teacher not found", HttpStatus.NOT_FOUND));

        if (teacherDto.getTeacherName() == null || teacherDto.getTeacherName().isBlank()) {
            throw new AppException("Teacher name is required", HttpStatus.BAD_REQUEST);
        }

        existing.setTeacherName(teacherDto.getTeacherName());
        existing.setCourse(resolveCourse(teacherDto));
        existing.setQualification(resolveQualification(teacherDto));
        if (teacherDto.getTeacherCode() != null && !teacherDto.getTeacherCode().isBlank()) {
            existing.setTeacherCode(teacherDto.getTeacherCode());
        }

        return academicMapper.toTeacherDto(teacherRepository.save(existing));
    }

    @Override
    @Transactional
    public TeacherDto deleteTeacher(long id) {
        TeacherEntity existing = teacherRepository.findById(id)
                .orElseThrow(() -> new AppException("Teacher not found", HttpStatus.NOT_FOUND));
        TeacherDto dto = academicMapper.toTeacherDto(existing);
        teacherRepository.delete(existing);
        return dto;
    }

    private CourseEntity resolveCourse(TeacherDto teacherDto) {
        if (teacherDto.getCourse() == null) {
            throw new AppException("Course is required", HttpStatus.BAD_REQUEST);
        }
        if (teacherDto.getCourse().getId() != null) {
            return courseRepository.findById(teacherDto.getCourse().getId())
                    .orElseThrow(() -> new AppException("Course not found", HttpStatus.BAD_REQUEST));
        }
        if (teacherDto.getCourse().getCourseName() != null && !teacherDto.getCourse().getCourseName().isBlank()) {
            return courseRepository.findByCourseName(teacherDto.getCourse().getCourseName().trim())
                    .orElseThrow(() -> new AppException("Course not found: " + teacherDto.getCourse().getCourseName(),
                            HttpStatus.BAD_REQUEST));
        }
        throw new AppException("Course is required", HttpStatus.BAD_REQUEST);
    }

    private QualificationEntity resolveQualification(TeacherDto teacherDto) {
        if (teacherDto.getQualification() == null || teacherDto.getQualification().getId() == null) {
            throw new AppException("Qualification is required", HttpStatus.BAD_REQUEST);
        }
        return qualificationRepository.findById(teacherDto.getQualification().getId())
                .orElseThrow(() -> new AppException("Qualification not found", HttpStatus.BAD_REQUEST));
    }
}
