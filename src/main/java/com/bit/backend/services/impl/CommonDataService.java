package com.bit.backend.services.impl;

import com.bit.backend.dtos.CommonDataDto;
import com.bit.backend.dtos.CommonDataListDto;
import com.bit.backend.entities.PrivilegeGroupAuth;
import com.bit.backend.entities.PrivilegeGroupUser;
import com.bit.backend.repositories.CommonDataRepository;
import com.bit.backend.repositories.PrivilegeGroupAuthRepository;
import com.bit.backend.repositories.PrivilegeGroupUserRepository;
import com.bit.backend.services.CommonDataServiceI;
import jakarta.persistence.Tuple;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommonDataService implements CommonDataServiceI {

    private final CommonDataRepository commonDataRepository;
    private final PrivilegeGroupAuthRepository privilegeGroupAuthRepository;
    private final PrivilegeGroupUserRepository privilegeGroupUserRepository;

    public CommonDataService(CommonDataRepository commonDataRepository,
                             PrivilegeGroupAuthRepository privilegeGroupAuthRepository,
                             PrivilegeGroupUserRepository privilegeGroupUserRepository) {
        this.commonDataRepository = commonDataRepository;
        this.privilegeGroupAuthRepository = privilegeGroupAuthRepository;
        this.privilegeGroupUserRepository = privilegeGroupUserRepository;
    }

    @Override
    public List<CommonDataDto> getAvailablePrivilegesByGroupID(int id) {
        return mapTuples(commonDataRepository.getAvailablePrivilegesByGroupId(id));
    }

    @Override
    public List<CommonDataDto> getAssignedPrivilegesByGroupID(int id) {
        return mapTuples(commonDataRepository.getAssignedPrivilegesByGroupId(id));
    }

    @Override
    @Transactional
    public CommonDataListDto saveData(int id, CommonDataListDto commonDataListDto) {
        List<CommonDataDto> added = nullSafe(commonDataListDto.getAddedData());
        List<CommonDataDto> removed = nullSafe(commonDataListDto.getRemovedData());

        for (CommonDataDto dto : removed) {
            if (dto.getId() == null) {
                continue;
            }
            privilegeGroupAuthRepository
                    .findByAuthGroupIdAndAuthId(id, dto.getId().intValue())
                    .ifPresent(privilegeGroupAuthRepository::delete);
        }

        for (CommonDataDto dto : added) {
            if (dto.getId() == null) {
                continue;
            }
            int authId = dto.getId().intValue();
            if (privilegeGroupAuthRepository.findByAuthGroupIdAndAuthId(id, authId).isPresent()) {
                continue;
            }
            PrivilegeGroupAuth entity = new PrivilegeGroupAuth();
            entity.setAuthGroupId(id);
            entity.setAuthId(authId);
            privilegeGroupAuthRepository.save(entity);
        }

        return commonDataListDto;
    }

    @Override
    public List<CommonDataDto> getAvailableUsersByGroupID(int id) {
        return mapTuples(commonDataRepository.getAvailableUsersByGroupID(id));
    }

    @Override
    public List<CommonDataDto> getAssignedUsersByGroupID(int id) {
        return mapTuples(commonDataRepository.getAssignedUsersByGroupId(id));
    }

    @Override
    @Transactional
    public CommonDataListDto saveGroupUserData(int id, CommonDataListDto commonDataListDto) {
        List<CommonDataDto> added = nullSafe(commonDataListDto.getAddedData());
        List<CommonDataDto> removed = nullSafe(commonDataListDto.getRemovedData());

        for (CommonDataDto dto : removed) {
            if (dto.getId() == null) {
                continue;
            }
            privilegeGroupUserRepository
                    .findByAuthGroupIdAndUserId(id, dto.getId().intValue())
                    .ifPresent(privilegeGroupUserRepository::delete);
        }

        for (CommonDataDto dto : added) {
            if (dto.getId() == null) {
                continue;
            }
            int userId = dto.getId().intValue();
            if (privilegeGroupUserRepository.findByAuthGroupIdAndUserId(id, userId).isPresent()) {
                continue;
            }
            PrivilegeGroupUser entity = new PrivilegeGroupUser();
            entity.setAuthGroupId(id);
            entity.setUserId(userId);
            privilegeGroupUserRepository.save(entity);
        }

        return commonDataListDto;
    }

    private List<CommonDataDto> mapTuples(List<Tuple> tuples) {
        if (tuples == null) {
            return Collections.emptyList();
        }
        return tuples.stream().map(t -> {
            CommonDataDto dto = new CommonDataDto();
            Number id = t.get(0, Number.class);
            dto.setId(id != null ? id.longValue() : null);
            dto.setDescription(t.get(1, String.class));
            return dto;
        }).collect(Collectors.toList());
    }

    private List<CommonDataDto> nullSafe(List<CommonDataDto> list) {
        return list != null ? list : Collections.emptyList();
    }
}
