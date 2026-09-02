package com.bit.backend.services;

import com.bit.backend.dtos.CourseDto;

import java.util.List;

public interface CourseServiceI {
    CourseDto addCourse(CourseDto courseDto);
    List<CourseDto> getAllCourses();
    CourseDto getCourseById(long id);
    CourseDto updateCourse(long id, CourseDto courseDto);
    CourseDto deleteCourse(long id);
}
