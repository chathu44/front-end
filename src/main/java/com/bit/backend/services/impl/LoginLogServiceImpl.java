package com.bit.backend.services.impl;

import com.bit.backend.dtos.LoginLogDto;
import com.bit.backend.entities.LoginLogEntity;
import com.bit.backend.entities.UserType;
import com.bit.backend.repositories.LoginLogRepository;
import com.bit.backend.services.LoginLogServiceI;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class LoginLogServiceImpl implements LoginLogServiceI {

    private final LoginLogRepository loginLogRepository;

    public LoginLogServiceImpl(LoginLogRepository loginLogRepository) {
        this.loginLogRepository = loginLogRepository;
    }

    @Override
    @Transactional
    public LoginLogDto recordStaffLogin(Long userId, String ipAddress) {
        LoginLogEntity entity = new LoginLogEntity();
        entity.setUserId(userId);
        entity.setUserType(UserType.Staff);
        entity.setLoginTime(LocalDateTime.now());
        entity.setIpAddress(ipAddress);
        return toDto(loginLogRepository.save(entity));
    }

    @Override
    @Transactional
    public LoginLogDto recordGuestLogin(String ipAddress) {
        LoginLogEntity entity = new LoginLogEntity();
        entity.setUserType(UserType.Guest);
        entity.setLoginTime(LocalDateTime.now());
        entity.setIpAddress(ipAddress);
        return toDto(loginLogRepository.save(entity));
    }

    @Override
    @Transactional
    public LoginLogDto recordLogout(Long userId) {
        LoginLogEntity entity = loginLogRepository
                .findTopByUserIdAndLogoutTimeIsNullOrderByLoginTimeDesc(userId)
                .orElse(null);

        if (entity == null) {
            return null;
        }

        entity.setLogoutTime(LocalDateTime.now());
        return toDto(loginLogRepository.save(entity));
    }

    @Override
    public List<LoginLogDto> getAllLoginLogs() {
        return loginLogRepository.findAll().stream().map(this::toDto).toList();
    }

    private LoginLogDto toDto(LoginLogEntity entity) {
        LoginLogDto dto = new LoginLogDto();
        dto.setLogId(entity.getLogId());
        dto.setUserId(entity.getUserId());
        dto.setUserType(entity.getUserType());
        dto.setLoginTime(entity.getLoginTime());
        dto.setLogoutTime(entity.getLogoutTime());
        dto.setIpAddress(entity.getIpAddress());
        return dto;
    }
}
