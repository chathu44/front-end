package com.bit.backend.mappers;

import com.bit.backend.dtos.PrivilegeGroupDto;
import com.bit.backend.entities.PrivilegeGroup;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-09T21:30:58+0530",
    comments = "version: 1.6.2, compiler: javac, environment: Java 21.0.4 (Oracle Corporation)"
)
@Component
public class PrivilegeGroupMapperImpl implements PrivilegeGroupMapper {

    @Override
    public PrivilegeGroupDto toPrivilegeGroupDto(PrivilegeGroup privilegeGroup) {
        if ( privilegeGroup == null ) {
            return null;
        }

        PrivilegeGroupDto privilegeGroupDto = new PrivilegeGroupDto();

        privilegeGroupDto.setId( privilegeGroup.getId() );
        privilegeGroupDto.setGroupName( privilegeGroup.getGroupName() );
        privilegeGroupDto.setGroupDescription( privilegeGroup.getGroupDescription() );
        privilegeGroupDto.setStatus( privilegeGroup.getStatus() );

        return privilegeGroupDto;
    }

    @Override
    public PrivilegeGroup toPrivilegeGroup(PrivilegeGroupDto privilegeGroupDto) {
        if ( privilegeGroupDto == null ) {
            return null;
        }

        PrivilegeGroup privilegeGroup = new PrivilegeGroup();

        privilegeGroup.setId( privilegeGroupDto.getId() );
        privilegeGroup.setGroupName( privilegeGroupDto.getGroupName() );
        privilegeGroup.setGroupDescription( privilegeGroupDto.getGroupDescription() );
        privilegeGroup.setStatus( privilegeGroupDto.getStatus() );

        return privilegeGroup;
    }

    @Override
    public List<PrivilegeGroupDto> toPrivilegeGroupList(List<PrivilegeGroup> privilegeGroups) {
        if ( privilegeGroups == null ) {
            return null;
        }

        List<PrivilegeGroupDto> list = new ArrayList<PrivilegeGroupDto>( privilegeGroups.size() );
        for ( PrivilegeGroup privilegeGroup : privilegeGroups ) {
            list.add( toPrivilegeGroupDto( privilegeGroup ) );
        }

        return list;
    }
}
