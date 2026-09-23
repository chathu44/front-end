package com.bit.backend.services;

import com.bit.backend.dtos.TeacherDto;

import java.util.List;

public interface TeacherServiceI {
    TeacherDto addTeacher(TeacherDto teacherDto);
    List<TeacherDto> getAllTeachers();
    TeacherDto getTeacherById(long id);
    TeacherDto updateTeacher(long id, TeacherDto teacherDto);
    TeacherDto deleteTeacher(long id);
}
