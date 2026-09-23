package com.bit.backend.dtos;

public class QualificationDto {
    private Long id;
    private String qualificationName;

    public QualificationDto() {
    }

    public QualificationDto(Long id, String qualificationName) {
        this.id = id;
        this.qualificationName = qualificationName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getQualificationName() {
        return qualificationName;
    }

    public void setQualificationName(String qualificationName) {
        this.qualificationName = qualificationName;
    }
}
