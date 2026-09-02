package com.bit.backend.controllers;

import com.bit.backend.dtos.ApiListResponse;
import com.bit.backend.dtos.StatusDto;
import com.bit.backend.dtos.StudentDto;
import com.bit.backend.services.StatusServiceI;
import com.bit.backend.services.StudentServiceI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class StudentController {

    private final StudentServiceI studentServiceI;
    private final StatusServiceI statusServiceI;

    public StudentController(StudentServiceI studentServiceI, StatusServiceI statusServiceI) {
        this.studentServiceI = studentServiceI;
        this.statusServiceI = statusServiceI;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiListResponse<StatusDto>> getAllStatus() {
        return ResponseEntity.ok(ApiListResponse.of(statusServiceI.getAllStatus()));
    }

    @GetMapping("/student")
    public ResponseEntity<ApiListResponse<StudentDto>> getAllStudents() {
        return ResponseEntity.ok(ApiListResponse.of(studentServiceI.getAllStudents()));
    }

    @GetMapping("/student/{id}")
    public ResponseEntity<ApiListResponse<StudentDto>> getStudentById(@PathVariable long id) {
        return ResponseEntity.ok(ApiListResponse.ofOne(studentServiceI.getStudentById(id)));
    }

    @PostMapping("/student")
    public ResponseEntity<ApiListResponse<StudentDto>> addStudent(@RequestBody StudentDto studentDto) {
        StudentDto created = studentServiceI.addStudent(studentDto);
        return ResponseEntity.created(URI.create("/api/v1/student/" + created.getId()))
                .body(ApiListResponse.ofOne(created));
    }

    @PutMapping("/student/{id}")
    public ResponseEntity<ApiListResponse<StudentDto>> updateStudent(
            @PathVariable long id,
            @RequestBody StudentDto studentDto) {
        return ResponseEntity.ok(ApiListResponse.ofOne(studentServiceI.updateStudent(id, studentDto)));
    }

    @DeleteMapping("/student/{id}")
    public ResponseEntity<ApiListResponse<StudentDto>> deleteStudent(@PathVariable long id) {
        return ResponseEntity.ok(ApiListResponse.ofOne(studentServiceI.deleteStudent(id)));
    }

    /**
     * Used by Class Registration grid filter.
     * Returns empty list until course-enrollment APIs are added.
     */
    @GetMapping("/student/getClass/{courseId}")
    public ResponseEntity<ApiListResponse<Map<String, Object>>> getStudentsForClass(@PathVariable long courseId) {
        List<Map<String, Object>> empty = Collections.emptyList();
        return ResponseEntity.ok(ApiListResponse.of(empty));
    }
}
