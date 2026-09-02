package com.bit.backend.services;

import com.bit.backend.dtos.StudentDto;

import java.util.List;

public interface StudentServiceI {
    StudentDto addStudent(StudentDto studentDto);
    List<StudentDto> getAllStudents();
    StudentDto getStudentById(long id);
    StudentDto updateStudent(long id, StudentDto studentDto);
    StudentDto deleteStudent(long id);
}
