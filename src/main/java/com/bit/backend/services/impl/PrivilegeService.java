package com.bit.backend.services.impl;

import com.bit.backend.dtos.SystemPrivilegeDto;
import com.bit.backend.dtos.SystemPrivilegeListDto;
import com.bit.backend.entities.Privilege;
import com.bit.backend.exceptions.AppException;
import com.bit.backend.repositories.PrivilegeRepository;
import com.bit.backend.repositories.UserRepository;
import com.bit.backend.services.PrivilegeServiceI;
import jakarta.persistence.Tuple;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PrivilegeService implements PrivilegeServiceI {

    private final PrivilegeRepository privilegeRepository;
    private final UserRepository userRepository;

    public PrivilegeService(PrivilegeRepository privilegeRepository, UserRepository userRepository) {
        this.privilegeRepository = privilegeRepository;
        this.userRepository = userRepository;
    }

    @Override
    public SystemPrivilegeListDto getSystemPrivileges() {
        List<Tuple> availableTuples = userRepository.getAvailableSystemPrivileges();
        List<Tuple> assignedTuples = userRepository.getAssignedSystemPrivileges();

        SystemPrivilegeListDto result = new SystemPrivilegeListDto();
        result.setSourcePrivileges(mapTuples(availableTuples));
        result.setTargetPrivileges(mapTuples(assignedTuples));
        return result;
    }

    @Override
    @Transactional
    public SystemPrivilegeListDto setSystemPrivileges(SystemPrivilegeListDto systemPrivilegeListDto) {
        if (systemPrivilegeListDto == null) {
            throw new AppException("Privilege payload is required", HttpStatus.BAD_REQUEST);
        }

        List<SystemPrivilegeDto> source = systemPrivilegeListDto.getSourcePrivileges() != null
                ? systemPrivilegeListDto.getSourcePrivileges()
                : Collections.emptyList();
        List<SystemPrivilegeDto> target = systemPrivilegeListDto.getTargetPrivileges() != null
                ? systemPrivilegeListDto.getTargetPrivileges()
                : Collections.emptyList();

        List<Privilege> toSave = new ArrayList<>();

        for (SystemPrivilegeDto dto : source) {
            Optional<Privilege> privilege = privilegeRepository.findByAuthId(dto.getId());
            if (privilege.isEmpty()) {
                continue;
            }
            privilege.get().setAssigned(0);
            toSave.add(privilege.get());
        }

        for (SystemPrivilegeDto dto : target) {
            Optional<Privilege> privilege = privilegeRepository.findByAuthId(dto.getId());
            if (privilege.isEmpty()) {
                continue;
            }
            privilege.get().setAssigned(1);
            toSave.add(privilege.get());
        }

        privilegeRepository.saveAll(toSave);
        return getSystemPrivileges();
    }

    private List<SystemPrivilegeDto> mapTuples(List<Tuple> tuples) {
        if (tuples == null) {
            return Collections.emptyList();
        }
        return tuples.stream().map(t -> {
            SystemPrivilegeDto dto = new SystemPrivilegeDto();
            Number id = t.get(0, Number.class);
            dto.setId(id != null ? id.intValue() : 0);
            dto.setDescription(t.get(1, String.class));
            return dto;
        }).collect(Collectors.toList());
    }
}
