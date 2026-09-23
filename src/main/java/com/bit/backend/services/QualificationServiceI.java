package com.bit.backend.services;

import com.bit.backend.dtos.QualificationDto;

import java.util.List;

public interface QualificationServiceI {
    List<QualificationDto> getAllQualifications();
    QualificationDto getQualificationById(long id);
    QualificationDto addQualification(QualificationDto qualificationDto);
    QualificationDto updateQualification(long id, QualificationDto qualificationDto);
    QualificationDto deleteQualification(long id);
}
