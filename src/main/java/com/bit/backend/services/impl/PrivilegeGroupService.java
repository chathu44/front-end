package com.bit.backend.services.impl;

import com.bit.backend.dtos.PrivilegeGroupDto;
import com.bit.backend.entities.PrivilegeGroup;
import com.bit.backend.exceptions.AppException;
import com.bit.backend.mappers.PrivilegeGroupMapper;
import com.bit.backend.repositories.PrivilegeGroupRepository;
import com.bit.backend.services.PrivilegeGroupServiceI;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PrivilegeGroupService implements PrivilegeGroupServiceI {

    private final PrivilegeGroupRepository privilegeGroupRepository;
    private final PrivilegeGroupMapper privilegeGroupMapper;

    public PrivilegeGroupService(PrivilegeGroupRepository privilegeGroupRepository,
                                 PrivilegeGroupMapper privilegeGroupMapper) {
        this.privilegeGroupRepository = privilegeGroupRepository;
        this.privilegeGroupMapper = privilegeGroupMapper;
    }

    @Override
    public List<PrivilegeGroupDto> getPrivilegeGroups() {
        return privilegeGroupMapper.toPrivilegeGroupList(privilegeGroupRepository.getActivePrivilegeGroups());
    }

    @Override
    @Transactional
    public PrivilegeGroupDto addPrivilegeGroup(PrivilegeGroupDto privilegeGroupDto) {
        List<PrivilegeGroup> existing = privilegeGroupRepository
                .findByGroupNameAndStatus(privilegeGroupDto.getGroupName().trim());

        if (!existing.isEmpty()) {
            throw new AppException("Privilege Group Already Exists", HttpStatus.BAD_REQUEST);
        }

        privilegeGroupDto.setStatus(1);
        PrivilegeGroup privilegeGroup = privilegeGroupMapper.toPrivilegeGroup(privilegeGroupDto);
        PrivilegeGroup saved = privilegeGroupRepository.save(privilegeGroup);
        return privilegeGroupMapper.toPrivilegeGroupDto(saved);
    }

    @Override
    @Transactional
    public PrivilegeGroupDto updatePrivilegeGroup(long id, PrivilegeGroupDto privilegeGroupDto) {
        PrivilegeGroup privilegeGroup = privilegeGroupRepository.findById(id)
                .orElseThrow(() -> new AppException("Privilege Group Not Exists", HttpStatus.NOT_FOUND));

        List<PrivilegeGroup> duplicates = privilegeGroupRepository.findByIdAndName(id, privilegeGroupDto.getGroupName());
        if (!duplicates.isEmpty()) {
            throw new AppException("Privilege Group With Same Name Exists!", HttpStatus.BAD_REQUEST);
        }

        privilegeGroup.setGroupName(privilegeGroupDto.getGroupName());
        privilegeGroup.setGroupDescription(privilegeGroupDto.getGroupDescription());

        PrivilegeGroup saved = privilegeGroupRepository.save(privilegeGroup);
        return privilegeGroupMapper.toPrivilegeGroupDto(saved);
    }

    @Override
    @Transactional
    public PrivilegeGroupDto deletePrivilegeGroup(long id) {
        PrivilegeGroup privilegeGroup = privilegeGroupRepository.findById(id)
                .orElseThrow(() -> new AppException("Privilege Group Not Exists", HttpStatus.NOT_FOUND));

        privilegeGroup.setStatus(0);
        PrivilegeGroup saved = privilegeGroupRepository.save(privilegeGroup);
        return privilegeGroupMapper.toPrivilegeGroupDto(saved);
    }
}
