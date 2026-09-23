package com.bit.backend.mappers;

import com.bit.backend.dtos.StatusDto;
import com.bit.backend.dtos.StudentDto;
import com.bit.backend.entities.StatusEntity;
import com.bit.backend.entities.StudentEntity;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", builder = @Builder(disableBuilder = true))
public interface StudentMapper {

    StatusDto toStatusDto(StatusEntity entity);

    List<StatusDto> toStatusDtoList(List<StatusEntity> entities);

    @Mapping(target = "status", source = "status")
    StudentDto toStudentDto(StudentEntity entity);

    List<StudentDto> toStudentDtoList(List<StudentEntity> entities);

    @Mapping(target = "status", ignore = true)
    StudentEntity toStudentEntity(StudentDto dto);
}
