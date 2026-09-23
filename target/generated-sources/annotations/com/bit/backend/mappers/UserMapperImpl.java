package com.bit.backend.mappers;

import com.bit.backend.dtos.AuthDto;
import com.bit.backend.dtos.SignUpDto;
import com.bit.backend.dtos.UserDto;
import com.bit.backend.entities.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-09T21:30:58+0530",
    comments = "version: 1.6.2, compiler: javac, environment: Java 21.0.4 (Oracle Corporation)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserDto toUserDto(User user) {
        if ( user == null ) {
            return null;
        }

        UserDto userDto = new UserDto();

        userDto.setId( user.getId() );
        userDto.setFirstName( user.getFirstName() );
        userDto.setLastName( user.getLastName() );
        userDto.setLogin( user.getLogin() );

        return userDto;
    }

    @Override
    public User signUpToUser(SignUpDto signUpDto) {
        if ( signUpDto == null ) {
            return null;
        }

        User user = new User();

        user.setFirstName( signUpDto.firstName() );
        user.setLastName( signUpDto.lastName() );
        user.setLogin( signUpDto.login() );

        return user;
    }

    @Override
    public AuthDto toAuthDto(Integer authId) {
        if ( authId == null ) {
            return null;
        }

        AuthDto authDto = new AuthDto();

        return authDto;
    }
}
