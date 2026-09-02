package com.bit.backend.services;

import com.bit.backend.dtos.SystemPrivilegeListDto;

public interface PrivilegeServiceI {
    SystemPrivilegeListDto getSystemPrivileges();
    SystemPrivilegeListDto setSystemPrivileges(SystemPrivilegeListDto systemPrivilegeListDto);
}
