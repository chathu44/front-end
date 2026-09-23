package com.bit.backend.services.impl;

import com.bit.backend.dtos.QualificationDto;
import com.bit.backend.entities.QualificationEntity;
import com.bit.backend.exceptions.AppException;
import com.bit.backend.mappers.AcademicMapper;
import com.bit.backend.repositories.QualificationRepository;
import com.bit.backend.services.QualificationServiceI;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class QualificationServiceImpl implements QualificationServiceI {

    private final QualificationRepository qualificationRepository;
    private final AcademicMapper academicMapper;

    public QualificationServiceImpl(QualificationRepository qualificationRepository,
                                    AcademicMapper academicMapper) {
        this.qualificationRepository = qualificationRepository;
        this.academicMapper = academicMapper;
    }

    @Override
    public List<QualificationDto> getAllQualifications() {
        return academicMapper.toQualificationDtoList(qualificationRepository.findAll());
    }

    @Override
    public QualificationDto getQualificationById(long id) {
        return academicMapper.toQualificationDto(qualificationRepository.findById(id)
                .orElseThrow(() -> new AppException("Qualification not found", HttpStatus.NOT_FOUND)));
    }

    @Override
    @Transactional
    public QualificationDto addQualification(QualificationDto qualificationDto) {
        String name = requireName(qualificationDto);
        if (qualificationRepository.existsByQualificationNameIgnoreCase(name)) {
            throw new AppException("Qualification already exists", HttpStatus.BAD_REQUEST);
        }
        QualificationEntity entity = new QualificationEntity();
        entity.setQualificationName(name);
        return academicMapper.toQualificationDto(qualificationRepository.save(entity));
    }

    @Override
    @Transactional
    public QualificationDto updateQualification(long id, QualificationDto qualificationDto) {
        QualificationEntity existing = qualificationRepository.findById(id)
                .orElseThrow(() -> new AppException("Qualification not found", HttpStatus.NOT_FOUND));

        String name = requireName(qualificationDto);
        qualificationRepository.findByQualificationNameIgnoreCase(name).ifPresent(other -> {
            if (!other.getId().equals(id)) {
                throw new AppException("Qualification already exists", HttpStatus.BAD_REQUEST);
            }
        });

        existing.setQualificationName(name);
        return academicMapper.toQualificationDto(qualificationRepository.save(existing));
    }

    @Override
    @Transactional
    public QualificationDto deleteQualification(long id) {
        QualificationEntity existing = qualificationRepository.findById(id)
                .orElseThrow(() -> new AppException("Qualification not found", HttpStatus.NOT_FOUND));
        QualificationDto dto = academicMapper.toQualificationDto(existing);
        try {
            qualificationRepository.delete(existing);
        } catch (Exception e) {
            throw new AppException("Cannot delete qualification because it is used by teachers",
                    HttpStatus.BAD_REQUEST);
        }
        return dto;
    }

    private String requireName(QualificationDto dto) {
        if (dto.getQualificationName() == null || dto.getQualificationName().isBlank()) {
            throw new AppException("Qualification name is required", HttpStatus.BAD_REQUEST);
        }
        return dto.getQualificationName().trim();
    }
}
