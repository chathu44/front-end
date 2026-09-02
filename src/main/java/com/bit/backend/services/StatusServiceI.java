package com.bit.backend.services;

import com.bit.backend.dtos.StatusDto;

import java.util.List;

public interface StatusServiceI {
    List<StatusDto> getAllStatus();
}
