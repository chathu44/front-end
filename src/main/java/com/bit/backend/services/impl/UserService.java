package com.bit.backend.services.impl;

import com.bit.backend.dtos.CredentialsDto;
import com.bit.backend.dtos.SignUpDto;
import com.bit.backend.dtos.UserDto;
import com.bit.backend.entities.User;
import com.bit.backend.exceptions.AppException;
import com.bit.backend.mappers.UserMapper;
import com.bit.backend.repositories.UserRepository;
import com.bit.backend.services.UserServiceI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.CharBuffer;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserServiceI {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    @Override
    public UserDto login(CredentialsDto credentialsDto) {
        logger.debug("Entering login...");
        User user = userRepository.findByLogin(credentialsDto.login())
                .orElseThrow(() -> new AppException("Unknown User", HttpStatus.NOT_FOUND));

        if (passwordEncoder.matches(CharBuffer.wrap(credentialsDto.password()), user.getPassword())) {
            return userMapper.toUserDto(user);
        }
        throw new AppException("Invalid password", HttpStatus.BAD_REQUEST);
    }

    @Override
    public UserDto register(SignUpDto signUpDto) {
        Optional<User> existing = userRepository.findByLogin(signUpDto.login());
        if (existing.isPresent()) {
            throw new AppException("User Already Exists", HttpStatus.BAD_REQUEST);
        }

        User user = userMapper.signUpToUser(signUpDto);
        user.setPassword(passwordEncoder.encode(CharBuffer.wrap(signUpDto.password())));
        User savedUser = userRepository.save(user);
        if (savedUser.getCreatedBy() == null) {
            savedUser.setCreatedBy(savedUser.getId());
            savedUser = userRepository.save(savedUser);
        }
        return userMapper.toUserDto(savedUser);
    }

    @Override
    public List<Integer> getAuthIds(long userId) {
        List<Integer> authIds = userRepository.findAuthIdsByUserId(userId);
        return authIds != null ? authIds : Collections.emptyList();
    }
}
