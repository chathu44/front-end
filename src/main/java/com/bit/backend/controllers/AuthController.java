package com.bit.backend.controllers;

import com.bit.backend.config.RequestUtils;
import com.bit.backend.config.UserAuthProvider;
import com.bit.backend.dtos.CredentialsDto;
import com.bit.backend.dtos.LoginLogDto;
import com.bit.backend.dtos.SignUpDto;
import com.bit.backend.dtos.UserDto;
import com.bit.backend.exceptions.AppException;
import com.bit.backend.services.LoginLogServiceI;
import com.bit.backend.services.UserServiceI;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
public class AuthController {

    private final UserServiceI userServiceI;
    private final UserAuthProvider userAuthProvider;
    private final LoginLogServiceI loginLogServiceI;

    public AuthController(UserServiceI userServiceI,
                          UserAuthProvider userAuthProvider,
                          LoginLogServiceI loginLogServiceI) {
        this.userServiceI = userServiceI;
        this.userAuthProvider = userAuthProvider;
        this.loginLogServiceI = loginLogServiceI;
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(@RequestBody CredentialsDto credentialsDto,
                                         HttpServletRequest request) {
        String ipAddress = RequestUtils.resolveClientIp(request);
        try {
            UserDto user = userServiceI.login(credentialsDto);
            user.setToken(userAuthProvider.createToken(user));
            loginLogServiceI.recordStaffLogin(user.getId(), ipAddress);
            return ResponseEntity.ok(user);
        } catch (AppException ex) {
            if (ex.getHttpStatus() == HttpStatus.NOT_FOUND || ex.getHttpStatus() == HttpStatus.BAD_REQUEST) {
                loginLogServiceI.recordGuestLogin(ipAddress);
            }
            throw ex;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<LoginLogDto> logout(Authentication authentication) {
        UserDto currentUser = (UserDto) authentication.getPrincipal();
        LoginLogDto log = loginLogServiceI.recordLogout(currentUser.getId());
        return ResponseEntity.ok(log);
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@RequestBody SignUpDto signUpDto) {
        UserDto user = userServiceI.register(signUpDto);
        user.setToken(userAuthProvider.createToken(user));
        return ResponseEntity.created(URI.create("/users/" + user.getId())).body(user);
    }

    /**
     * Returns privilege (auth) IDs for the given user.
     * Students may only request their own auth IDs unless calling for themselves.
     */
    @GetMapping("/get-auth-ids/{id}")
    public ResponseEntity<List<Integer>> getAuthDetails(@PathVariable long id, Authentication authentication) {
        UserDto currentUser = (UserDto) authentication.getPrincipal();
        if (currentUser.getId() == null || !currentUser.getId().equals(id)) {
            throw new AppException("You can only request your own privilege IDs", HttpStatus.FORBIDDEN);
        }
        return ResponseEntity.ok(userServiceI.getAuthIds(id));
    }
}
