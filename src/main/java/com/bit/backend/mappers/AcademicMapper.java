package com.bit.backend.mappers;

import com.bit.backend.dtos.CourseDto;
import com.bit.backend.dtos.QualificationDto;
import com.bit.backend.dtos.TeacherDto;
import com.bit.backend.entities.CourseEntity;
import com.bit.backend.entities.QualificationEntity;
import com.bit.backend.entities.TeacherEntity;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", builder = @Builder(disableBuilder = true))
public interface AcademicMapper {

    CourseDto toCourseDto(CourseEntity entity);

    List<CourseDto> toCourseDtoList(List<CourseEntity> entities);

    CourseEntity toCourseEntity(CourseDto dto);

    QualificationDto toQualificationDto(QualificationEntity entity);

    List<QualificationDto> toQualificationDtoList(List<QualificationEntity> entities);

    @Mapping(target = "course", source = "course")
    @Mapping(target = "qualification", source = "qualification")
    TeacherDto toTeacherDto(TeacherEntity entity);

    List<TeacherDto> toTeacherDtoList(List<TeacherEntity> entities);

    @Mapping(target = "course", ignore = true)
    @Mapping(target = "qualification", ignore = true)
    TeacherEntity toTeacherEntity(TeacherDto dto);
}
