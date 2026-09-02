package com.bit.backend.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "student")
public class StudentEntity extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_code")
    private String studentCode;

    @Column(name = "student_name", nullable = false)
    private String studentName;

    @Column(name = "student_age")
    private String studentAge;

    @Column(name = "student_nic")
    private String studentNic;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "status_id", nullable = false)
    private StatusEntity status;

    public StudentEntity() {
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

    public StatusEntity getStatus() {
        return status;
    }

    public void setStatus(StatusEntity status) {
        this.status = status;
    }
}
