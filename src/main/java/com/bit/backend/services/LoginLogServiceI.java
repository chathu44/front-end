package com.bit.backend.services;

import com.bit.backend.dtos.LoginLogDto;

import java.util.List;

public interface LoginLogServiceI {

    LoginLogDto recordStaffLogin(Long userId, String ipAddress);

    LoginLogDto recordGuestLogin(String ipAddress);

    LoginLogDto recordLogout(Long userId);

    List<LoginLogDto> getAllLoginLogs();
}
