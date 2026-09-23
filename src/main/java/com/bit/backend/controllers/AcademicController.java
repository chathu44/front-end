package com.bit.backend.controllers;

import com.bit.backend.dtos.ApiListResponse;
import com.bit.backend.dtos.CourseDto;
import com.bit.backend.dtos.QualificationDto;
import com.bit.backend.dtos.TeacherDto;
import com.bit.backend.services.CourseServiceI;
import com.bit.backend.services.QualificationServiceI;
import com.bit.backend.services.TeacherServiceI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1")
public class AcademicController {

    private final CourseServiceI courseServiceI;
    private final TeacherServiceI teacherServiceI;
    private final QualificationServiceI qualificationServiceI;

    public AcademicController(CourseServiceI courseServiceI,
                              TeacherServiceI teacherServiceI,
                              QualificationServiceI qualificationServiceI) {
        this.courseServiceI = courseServiceI;
        this.teacherServiceI = teacherServiceI;
        this.qualificationServiceI = qualificationServiceI;
    }

    // -------- Course --------

    @GetMapping("/course")
    public ResponseEntity<ApiListResponse<CourseDto>> getAllCourses() {
        return ResponseEntity.ok(ApiListResponse.of(courseServiceI.getAllCourses()));
    }

    @GetMapping("/course/{id}")
    public ResponseEntity<ApiListResponse<CourseDto>> getCourseById(@PathVariable long id) {
        return ResponseEntity.ok(ApiListResponse.ofOne(courseServiceI.getCourseById(id)));
    }

    @PostMapping("/course")
    public ResponseEntity<ApiListResponse<CourseDto>> addCourse(@RequestBody CourseDto courseDto) {
        CourseDto created = courseServiceI.addCourse(courseDto);
        return ResponseEntity.created(URI.create("/api/v1/course/" + created.getId()))
                .body(ApiListResponse.ofOne(created));
    }

    @PutMapping("/course/{id}")
    public ResponseEntity<ApiListResponse<CourseDto>> updateCourse(
            @PathVariable long id,
            @RequestBody CourseDto courseDto) {
        return ResponseEntity.ok(ApiListResponse.ofOne(courseServiceI.updateCourse(id, courseDto)));
    }

    @DeleteMapping("/course/{id}")
    public ResponseEntity<ApiListResponse<CourseDto>> deleteCourse(@PathVariable long id) {
        return ResponseEntity.ok(ApiListResponse.ofOne(courseServiceI.deleteCourse(id)));
    }

    // -------- Qualification --------

    @GetMapping("/qualification")
    public ResponseEntity<ApiListResponse<QualificationDto>> getAllQualifications() {
        return ResponseEntity.ok(ApiListResponse.of(qualificationServiceI.getAllQualifications()));
    }

    @GetMapping("/qualification/{id}")
    public ResponseEntity<ApiListResponse<QualificationDto>> getQualificationById(@PathVariable long id) {
        return ResponseEntity.ok(ApiListResponse.ofOne(qualificationServiceI.getQualificationById(id)));
    }

    @PostMapping("/qualification")
    public ResponseEntity<ApiListResponse<QualificationDto>> addQualification(
            @RequestBody QualificationDto qualificationDto) {
        QualificationDto created = qualificationServiceI.addQualification(qualificationDto);
        return ResponseEntity.created(URI.create("/api/v1/qualification/" + created.getId()))
                .body(ApiListResponse.ofOne(created));
    }

    @PutMapping("/qualification/{id}")
    public ResponseEntity<ApiListResponse<QualificationDto>> updateQualification(
            @PathVariable long id,
            @RequestBody QualificationDto qualificationDto) {
        return ResponseEntity.ok(ApiListResponse.ofOne(
                qualificationServiceI.updateQualification(id, qualificationDto)));
    }

    @DeleteMapping("/qualification/{id}")
    public ResponseEntity<ApiListResponse<QualificationDto>> deleteQualification(@PathVariable long id) {
        return ResponseEntity.ok(ApiListResponse.ofOne(qualificationServiceI.deleteQualification(id)));
    }

    // -------- Teacher --------

    @GetMapping("/teacher")
    public ResponseEntity<ApiListResponse<TeacherDto>> getAllTeachers() {
        return ResponseEntity.ok(ApiListResponse.of(teacherServiceI.getAllTeachers()));
    }

    @GetMapping("/teacher/{id}")
    public ResponseEntity<ApiListResponse<TeacherDto>> getTeacherById(@PathVariable long id) {
        return ResponseEntity.ok(ApiListResponse.ofOne(teacherServiceI.getTeacherById(id)));
    }

    @PostMapping("/teacher")
    public ResponseEntity<ApiListResponse<TeacherDto>> addTeacher(@RequestBody TeacherDto teacherDto) {
        TeacherDto created = teacherServiceI.addTeacher(teacherDto);
        return ResponseEntity.created(URI.create("/api/v1/teacher/" + created.getId()))
                .body(ApiListResponse.ofOne(created));
    }

    @PutMapping("/teacher/{id}")
    public ResponseEntity<ApiListResponse<TeacherDto>> updateTeacher(
            @PathVariable long id,
            @RequestBody TeacherDto teacherDto) {
        return ResponseEntity.ok(ApiListResponse.ofOne(teacherServiceI.updateTeacher(id, teacherDto)));
    }

    @DeleteMapping("/teacher/{id}")
    public ResponseEntity<ApiListResponse<TeacherDto>> deleteTeacher(@PathVariable long id) {
        return ResponseEntity.ok(ApiListResponse.ofOne(teacherServiceI.deleteTeacher(id)));
    }
}
