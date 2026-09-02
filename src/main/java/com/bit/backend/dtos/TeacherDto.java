package com.bit.backend.dtos;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.databind.JsonNode;

public class TeacherDto {
    private Long id;
    private String teacherCode;
    private String teacherName;
    private CourseDto course;
    private QualificationDto qualification;

    public TeacherDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTeacherCode() {
        return teacherCode;
    }

    public void setTeacherCode(String teacherCode) {
        this.teacherCode = teacherCode;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }

    public CourseDto getCourse() {
        return course;
    }

    public void setCourse(CourseDto course) {
        this.course = course;
    }

    public QualificationDto getQualification() {
        return qualification;
    }

    public void setQualification(QualificationDto qualification) {
        this.qualification = qualification;
    }

    /** Frontend sends course as courseName string or as { id, courseName }. */
    @JsonSetter("course")
    public void setCourseFromJson(JsonNode node) {
        if (node == null || node.isNull()) {
            this.course = null;
            return;
        }
        CourseDto dto = new CourseDto();
        if (node.isTextual()) {
            dto.setCourseName(node.asText());
            this.course = dto;
            return;
        }
        if (node.isNumber()) {
            dto.setId(node.asLong());
            this.course = dto;
            return;
        }
        if (node.isObject()) {
            if (node.hasNonNull("id")) {
                dto.setId(node.get("id").asLong());
            }
            if (node.hasNonNull("courseCode")) {
                dto.setCourseCode(node.get("courseCode").asText());
            }
            if (node.hasNonNull("courseName")) {
                dto.setCourseName(node.get("courseName").asText());
            }
            this.course = dto;
        }
    }

    /** Frontend sends qualification as id string/number or as { id, qualificationName }. */
    @JsonSetter("qualification")
    public void setQualificationFromJson(JsonNode node) {
        if (node == null || node.isNull()) {
            this.qualification = null;
            return;
        }
        QualificationDto dto = new QualificationDto();
        if (node.isNumber() || node.isTextual()) {
            dto.setId(node.asLong());
            this.qualification = dto;
            return;
        }
        if (node.isObject()) {
            if (node.hasNonNull("id")) {
                dto.setId(node.get("id").asLong());
            }
            if (node.hasNonNull("qualificationName")) {
                dto.setQualificationName(node.get("qualificationName").asText());
            }
            this.qualification = dto;
        }
    }
}
