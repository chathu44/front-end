package com.bit.backend.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "teacher")
public class TeacherEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "teacher_code")
    private String teacherCode;

    @Column(name = "teacher_name", nullable = false)
    private String teacherName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private CourseEntity course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "qualification_id", nullable = false)
    private QualificationEntity qualification;

    public TeacherEntity() {
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

    public CourseEntity getCourse() {
        return course;
    }

    public void setCourse(CourseEntity course) {
        this.course = course;
    }

    public QualificationEntity getQualification() {
        return qualification;
    }

    public void setQualification(QualificationEntity qualification) {
        this.qualification = qualification;
    }
}
