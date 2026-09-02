package com.bit.backend.services.impl;

import com.bit.backend.dtos.StudentDto;
import com.bit.backend.entities.StatusEntity;
import com.bit.backend.entities.StudentEntity;
import com.bit.backend.exceptions.AppException;
import com.bit.backend.mappers.StudentMapper;
import com.bit.backend.repositories.StatusRepository;
import com.bit.backend.repositories.StudentRepository;
import com.bit.backend.services.StudentServiceI;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentServiceImpl implements StudentServiceI {

    private final StudentRepository studentRepository;
    private final StatusRepository statusRepository;
    private final StudentMapper studentMapper;

    public StudentServiceImpl(StudentRepository studentRepository,
                              StatusRepository statusRepository,
                              StudentMapper studentMapper) {
        this.studentRepository = studentRepository;
        this.statusRepository = statusRepository;
        this.studentMapper = studentMapper;
    }

    @Override
    @Transactional
    public StudentDto addStudent(StudentDto studentDto) {
        StatusEntity status = resolveStatus(studentDto);
        StudentEntity entity = studentMapper.toStudentEntity(studentDto);
        entity.setId(null);
        entity.setStatus(status);

        StudentEntity saved = studentRepository.save(entity);
        if (saved.getStudentCode() == null || saved.getStudentCode().isBlank()) {
            saved.setStudentCode("STU-" + saved.getId());
            saved = studentRepository.save(saved);
        }
        return studentMapper.toStudentDto(saved);
    }

    @Override
    public List<StudentDto> getAllStudents() {
        return studentMapper.toStudentDtoList(studentRepository.findAll());
    }

    @Override
    public StudentDto getStudentById(long id) {
        StudentEntity entity = studentRepository.findById(id)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
        return studentMapper.toStudentDto(entity);
    }

    @Override
    @Transactional
    public StudentDto updateStudent(long id, StudentDto studentDto) {
        StudentEntity existing = studentRepository.findById(id)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));

        StatusEntity status = resolveStatus(studentDto);
        existing.setStudentName(studentDto.getStudentName());
        existing.setStudentAge(studentDto.getStudentAge());
        existing.setStudentNic(studentDto.getStudentNic());
        existing.setStatus(status);
        if (studentDto.getStudentCode() != null && !studentDto.getStudentCode().isBlank()) {
            existing.setStudentCode(studentDto.getStudentCode());
        }

        return studentMapper.toStudentDto(studentRepository.save(existing));
    }

    @Override
    @Transactional
    public StudentDto deleteStudent(long id) {
        StudentEntity existing = studentRepository.findById(id)
                .orElseThrow(() -> new AppException("Student not found", HttpStatus.NOT_FOUND));
        StudentDto dto = studentMapper.toStudentDto(existing);
        studentRepository.delete(existing);
        return dto;
    }

    private StatusEntity resolveStatus(StudentDto studentDto) {
        if (studentDto.getStatus() == null || studentDto.getStatus().getId() == null) {
            throw new AppException("Status is required", HttpStatus.BAD_REQUEST);
        }
        return statusRepository.findById(studentDto.getStatus().getId())
                .orElseThrow(() -> new AppException("Status not found", HttpStatus.BAD_REQUEST));
    }
}
