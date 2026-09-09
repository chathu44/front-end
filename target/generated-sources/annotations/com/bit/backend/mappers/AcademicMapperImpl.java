package com.bit.backend.mappers;

import com.bit.backend.dtos.CourseDto;
import com.bit.backend.dtos.QualificationDto;
import com.bit.backend.dtos.TeacherDto;
import com.bit.backend.entities.CourseEntity;
import com.bit.backend.entities.QualificationEntity;
import com.bit.backend.entities.TeacherEntity;
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
public class AcademicMapperImpl implements AcademicMapper {

    @Override
    public CourseDto toCourseDto(CourseEntity entity) {
        if ( entity == null ) {
            return null;
        }

        CourseDto courseDto = new CourseDto();

        courseDto.setId( entity.getId() );
        courseDto.setCourseCode( entity.getCourseCode() );
        courseDto.setCourseName( entity.getCourseName() );

        return courseDto;
    }

    @Override
    public List<CourseDto> toCourseDtoList(List<CourseEntity> entities) {
        if ( entities == null ) {
            return null;
        }

        List<CourseDto> list = new ArrayList<CourseDto>( entities.size() );
        for ( CourseEntity courseEntity : entities ) {
            list.add( toCourseDto( courseEntity ) );
        }

        return list;
    }

    @Override
    public CourseEntity toCourseEntity(CourseDto dto) {
        if ( dto == null ) {
            return null;
        }

        CourseEntity courseEntity = new CourseEntity();

        courseEntity.setId( dto.getId() );
        courseEntity.setCourseCode( dto.getCourseCode() );
        courseEntity.setCourseName( dto.getCourseName() );

        return courseEntity;
    }

    @Override
    public QualificationDto toQualificationDto(QualificationEntity entity) {
        if ( entity == null ) {
            return null;
        }

        QualificationDto qualificationDto = new QualificationDto();

        qualificationDto.setId( entity.getId() );
        qualificationDto.setQualificationName( entity.getQualificationName() );

        return qualificationDto;
    }

    @Override
    public List<QualificationDto> toQualificationDtoList(List<QualificationEntity> entities) {
        if ( entities == null ) {
            return null;
        }

        List<QualificationDto> list = new ArrayList<QualificationDto>( entities.size() );
        for ( QualificationEntity qualificationEntity : entities ) {
            list.add( toQualificationDto( qualificationEntity ) );
        }

        return list;
    }

    @Override
    public TeacherDto toTeacherDto(TeacherEntity entity) {
        if ( entity == null ) {
            return null;
        }

        TeacherDto teacherDto = new TeacherDto();

        teacherDto.setCourse( toCourseDto( entity.getCourse() ) );
        teacherDto.setQualification( toQualificationDto( entity.getQualification() ) );
        teacherDto.setId( entity.getId() );
        teacherDto.setTeacherCode( entity.getTeacherCode() );
        teacherDto.setTeacherName( entity.getTeacherName() );

        return teacherDto;
    }

    @Override
    public List<TeacherDto> toTeacherDtoList(List<TeacherEntity> entities) {
        if ( entities == null ) {
            return null;
        }

        List<TeacherDto> list = new ArrayList<TeacherDto>( entities.size() );
        for ( TeacherEntity teacherEntity : entities ) {
            list.add( toTeacherDto( teacherEntity ) );
        }

        return list;
    }

    @Override
    public TeacherEntity toTeacherEntity(TeacherDto dto) {
        if ( dto == null ) {
            return null;
        }

        TeacherEntity teacherEntity = new TeacherEntity();

        teacherEntity.setId( dto.getId() );
        teacherEntity.setTeacherCode( dto.getTeacherCode() );
        teacherEntity.setTeacherName( dto.getTeacherName() );

        return teacherEntity;
    }
}
