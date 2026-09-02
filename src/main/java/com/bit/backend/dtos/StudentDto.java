package com.bit.backend.dtos;

import com.fasterxml.jackson.databind.JsonNode;

public class StudentDto {
    private Long id;
    private String studentCode;
    private String studentName;
    private String studentAge;
    private String studentNic;
    private StatusDto status;

    public StudentDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentAge() {
        return studentAge;
    }

    public void setStudentAge(String studentAge) {
        this.studentAge = studentAge;
    }

    public String getStudentNic() {
        return studentNic;
    }

    public void setStudentNic(String studentNic) {
        this.studentNic = studentNic;
    }

    public StatusDto getStatus() {
        return status;
    }

    public void setStatus(StatusDto status) {
        this.status = status;
    }

    /**
     * Frontend sometimes sends status as id ("1") and sometimes as { id, name }.
     */
    @com.fasterxml.jackson.annotation.JsonSetter("status")
    public void setStatusFromJson(JsonNode node) {
        if (node == null || node.isNull()) {
            this.status = null;
            return;
        }
        StatusDto dto = new StatusDto();
        if (node.isNumber() || node.isTextual()) {
            dto.setId(node.asLong());
            this.status = dto;
            return;
        }
        if (node.isObject()) {
            if (node.hasNonNull("id")) {
                dto.setId(node.get("id").asLong());
            }
            if (node.hasNonNull("name")) {
                dto.setName(node.get("name").asText());
            }
            this.status = dto;
        }
    }
}
