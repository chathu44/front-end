package com.bit.backend.services.impl;

import com.bit.backend.dtos.StatusDto;
import com.bit.backend.mappers.StudentMapper;
import com.bit.backend.repositories.StatusRepository;
import com.bit.backend.services.StatusServiceI;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StatusService implements StatusServiceI {

    private final StatusRepository statusRepository;
    private final StudentMapper studentMapper;

    public StatusService(StatusRepository statusRepository, StudentMapper studentMapper) {
        this.statusRepository = statusRepository;
        this.studentMapper = studentMapper;
    }

    @Override
    public List<StatusDto> getAllStatus() {
        return studentMapper.toStatusDtoList(statusRepository.findAll());
    }
}
