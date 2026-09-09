package com.bit.backend.mappers;

import com.bit.backend.dtos.ParentDto;
import com.bit.backend.dtos.StatusDto;
import com.bit.backend.entities.Parent;
import com.bit.backend.entities.StatusEntity;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-09T23:36:44+0530",
    comments = "version: 1.6.2, compiler: javac, environment: Java 21.0.4 (Oracle Corporation)"
)
@Component
public class ParentMapperImpl implements ParentMapper {

    @Override
    public StatusDto toStatusDto(StatusEntity entity) {
        if ( entity == null ) {
            return null;
        }

        StatusDto statusDto = new StatusDto();

        statusDto.setId( entity.getId() );
        statusDto.setName( entity.getName() );

        return statusDto;
    }

    @Override
    public List<StatusDto> toStatusDtoList(List<StatusEntity> entities) {
        if ( entities == null ) {
            return null;
        }

        List<StatusDto> list = new ArrayList<StatusDto>( entities.size() );
        for ( StatusEntity statusEntity : entities ) {
            list.add( toStatusDto( statusEntity ) );
        }

        return list;
    }

    @Override
    public ParentDto toParentDto(Parent entity) {
        if ( entity == null ) {
            return null;
        }

        ParentDto parentDto = new ParentDto();

        parentDto.setStatus( toStatusDto( entity.getStatus() ) );
        parentDto.setId( entity.getId() );
        parentDto.setParentCode( entity.getParentCode() );
        parentDto.setFullName( entity.getFullName() );
        parentDto.setRelationship( entity.getRelationship() );
        parentDto.setPhone( entity.getPhone() );
        parentDto.setAlternatePhone( entity.getAlternatePhone() );
        parentDto.setEmail( entity.getEmail() );
        parentDto.setNic( entity.getNic() );
        parentDto.setAddress( entity.getAddress() );
        parentDto.setWorkplace( entity.getWorkplace() );

        return parentDto;
    }

    @Override
    public List<ParentDto> toParentDtoList(List<Parent> entities) {
        if ( entities == null ) {
            return null;
        }

        List<ParentDto> list = new ArrayList<ParentDto>( entities.size() );
        for ( Parent parent : entities ) {
            list.add( toParentDto( parent ) );
        }

        return list;
    }

    @Override
    public Parent toParent(ParentDto dto) {
        if ( dto == null ) {
            return null;
        }

        Parent parent = new Parent();

        parent.setId( dto.getId() );
        parent.setParentCode( dto.getParentCode() );
        parent.setFullName( dto.getFullName() );
        parent.setRelationship( dto.getRelationship() );
        parent.setPhone( dto.getPhone() );
        parent.setAlternatePhone( dto.getAlternatePhone() );
        parent.setEmail( dto.getEmail() );
        parent.setNic( dto.getNic() );
        parent.setAddress( dto.getAddress() );
        parent.setWorkplace( dto.getWorkplace() );

        return parent;
    }
}
