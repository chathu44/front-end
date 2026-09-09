package com.bit.backend.services.impl;

import com.bit.backend.dtos.ParentDto;
import com.bit.backend.entities.StatusEntity;
import com.bit.backend.entities.Parent;
import com.bit.backend.exceptions.AppException;
import com.bit.backend.mappers.ParentMapper;
import com.bit.backend.repositories.StatusRepository;
import com.bit.backend.repositories.ParentRepository;
import com.bit.backend.services.ParentServiceI;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ParentServiceImpl implements ParentServiceI {

    private final ParentRepository parentRepository;
    private final StatusRepository statusRepository;
    private final ParentMapper parentMapper;

    public ParentServiceImpl(ParentRepository parentRepository,
                             StatusRepository statusRepository,
                             ParentMapper parentMapper) {
        this.parentRepository = parentRepository;
        this.statusRepository = statusRepository;
        this.parentMapper = parentMapper;
    }

    @Override
    @Transactional
    public ParentDto addParent(ParentDto parentDto) {
        StatusEntity status = resolveStatus(parentDto);
        Parent entity = parentMapper.toParent(parentDto);
        entity.setId(null);
        entity.setStatus(status);

        Parent saved = parentRepository.save(entity);
        if (saved.getParentCode() == null || saved.getParentCode().isBlank()) {
            saved.setParentCode("PAR-" + saved.getId());
            saved = parentRepository.save(saved);
        }
        return parentMapper.toParentDto(saved);
    }

    @Override
    public List<ParentDto> getAllParents() {
        return parentMapper.toParentDtoList(parentRepository.findAll());
    }

    @Override
    public ParentDto getParentById(long id) {
        Parent entity = parentRepository.findById(id)
                .orElseThrow(() -> new AppException("Parent not found", HttpStatus.NOT_FOUND));
        return parentMapper.toParentDto(entity);
    }

    @Override
    @Transactional
    public ParentDto updateParent(long id, ParentDto parentDto) {
        Parent existing = parentRepository.findById(id)
                .orElseThrow(() -> new AppException("Parent not found", HttpStatus.NOT_FOUND));

        StatusEntity status = resolveStatus(parentDto);
        existing.setFullName(parentDto.getFullName());
        existing.setRelationship(parentDto.getRelationship());
        existing.setPhone(parentDto.getPhone());
        existing.setAlternatePhone(parentDto.getAlternatePhone());
        existing.setEmail(parentDto.getEmail());
        existing.setNic(parentDto.getNic());
        existing.setAddress(parentDto.getAddress());
        existing.setWorkplace(parentDto.getWorkplace());
        existing.setStatus(status);
        if (parentDto.getParentCode() != null && !parentDto.getParentCode().isBlank()) {
            existing.setParentCode(parentDto.getParentCode());
        }

        return parentMapper.toParentDto(parentRepository.save(existing));
    }

    @Override
    @Transactional
    public ParentDto deleteParent(long id) {
        Parent existing = parentRepository.findById(id)
                .orElseThrow(() -> new AppException("Parent not found", HttpStatus.NOT_FOUND));
        ParentDto dto = parentMapper.toParentDto(existing);
        parentRepository.delete(existing);
        return dto;
    }

    private StatusEntity resolveStatus(ParentDto parentDto) {
        if (parentDto.getStatus() == null || parentDto.getStatus().getId() == null) {
            throw new AppException("Status is required", HttpStatus.BAD_REQUEST);
        }
        return statusRepository.findById(parentDto.getStatus().getId())
                .orElseThrow(() -> new AppException("Status not found", HttpStatus.BAD_REQUEST));
    }
}
