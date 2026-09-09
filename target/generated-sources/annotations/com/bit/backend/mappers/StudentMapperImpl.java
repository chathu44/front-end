package com.bit.backend.mappers;

import com.bit.backend.dtos.StatusDto;
import com.bit.backend.dtos.StudentDto;
import com.bit.backend.entities.StatusEntity;
import com.bit.backend.entities.StudentEntity;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-09T21:30:57+0530",
    comments = "version: 1.6.2, compiler: javac, environment: Java 21.0.4 (Oracle Corporation)"
)
@Component
public class StudentMapperImpl implements StudentMapper {

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
    public StudentDto toStudentDto(StudentEntity entity) {
        if ( entity == null ) {
            return null;
        }

        StudentDto studentDto = new StudentDto();

        studentDto.setStatus( toStatusDto( entity.getStatus() ) );
        studentDto.setId( entity.getId() );
        studentDto.setStudentCode( entity.getStudentCode() );
        studentDto.setStudentName( entity.getStudentName() );
        studentDto.setStudentAge( entity.getStudentAge() );
        studentDto.setStudentNic( entity.getStudentNic() );

        return studentDto;
    }

    @Override
    public List<StudentDto> toStudentDtoList(List<StudentEntity> entities) {
        if ( entities == null ) {
            return null;
        }

        List<StudentDto> list = new ArrayList<StudentDto>( entities.size() );
        for ( StudentEntity studentEntity : entities ) {
            list.add( toStudentDto( studentEntity ) );
        }

        return list;
    }

    @Override
    public StudentEntity toStudentEntity(StudentDto dto) {
        if ( dto == null ) {
            return null;
        }

        StudentEntity studentEntity = new StudentEntity();

        studentEntity.setId( dto.getId() );
        studentEntity.setStudentCode( dto.getStudentCode() );
        studentEntity.setStudentName( dto.getStudentName() );
        studentEntity.setStudentAge( dto.getStudentAge() );
        studentEntity.setStudentNic( dto.getStudentNic() );

        return studentEntity;
    }
}
