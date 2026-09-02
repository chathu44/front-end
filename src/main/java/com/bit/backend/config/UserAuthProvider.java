package com.bit.backend.config;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.bit.backend.dtos.UserDto;
import com.bit.backend.entities.User;
import com.bit.backend.exceptions.AppException;
import com.bit.backend.mappers.UserMapper;
import com.bit.backend.repositories.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.Collections;
import java.util.Date;

@Component
public class UserAuthProvider {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserAuthProvider(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Value("${security.jwt.token.secret-key:change-me-in-application-properties}")
    private String secretKey;

    @PostConstruct
    protected void init() {
        secretKey = Base64.getEncoder().encodeToString(secretKey.getBytes());
    }

    public String createToken(UserDto userDto) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + 86_400_000L); // 24 hours

        return JWT.create()
                .withIssuer(userDto.getLogin())
                .withIssuedAt(now)
                .withExpiresAt(validity)
                .withClaim("id", userDto.getId())
                .withClaim("firstName", userDto.getFirstName())
                .withClaim("lastName", userDto.getLastName())
                .sign(Algorithm.HMAC256(secretKey));
    }

    public Authentication validateToken(String token) {
        DecodedJWT decodedJWT = verify(token);

        UserDto userDto = UserDto.builder()
                .id(decodedJWT.getClaim("id").asLong())
                .login(decodedJWT.getIssuer())
                .firstName(decodedJWT.getClaim("firstName").asString())
                .lastName(decodedJWT.getClaim("lastName").asString())
                .build();

        return new UsernamePasswordAuthenticationToken(userDto, null, Collections.emptyList());
    }

    public Authentication validateTokenStrongly(String token) {
        DecodedJWT decodedJWT = verify(token);

        User user = userRepository.findByLogin(decodedJWT.getIssuer())
                .orElseThrow(() -> new AppException("Unknown User", HttpStatus.NOT_FOUND));
        return new UsernamePasswordAuthenticationToken(userMapper.toUserDto(user), null, Collections.emptyList());
    }

    private DecodedJWT verify(String token) {
        Algorithm algorithm = Algorithm.HMAC256(secretKey);
        JWTVerifier verifier = JWT.require(algorithm).build();
        return verifier.verify(token);
    }
}
