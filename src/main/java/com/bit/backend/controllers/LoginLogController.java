package com.bit.backend.controllers;

import com.bit.backend.dtos.LoginLogDto;
import com.bit.backend.services.LoginLogServiceI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class LoginLogController {

    private final LoginLogServiceI loginLogServiceI;

    public LoginLogController(LoginLogServiceI loginLogServiceI) {
        this.loginLogServiceI = loginLogServiceI;
    }

    @GetMapping("/login-logs")
    public ResponseEntity<List<LoginLogDto>> getLoginLogs() {
        return ResponseEntity.ok(loginLogServiceI.getAllLoginLogs());
    }
}
