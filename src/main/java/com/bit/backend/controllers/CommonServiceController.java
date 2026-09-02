package com.bit.backend.controllers;

import com.bit.backend.dtos.CommonDataDto;
import com.bit.backend.dtos.CommonDataListDto;
import com.bit.backend.services.CommonDataServiceI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/common-data-service")
public class CommonServiceController {

    private final CommonDataServiceI commonDataServiceI;

    public CommonServiceController(CommonDataServiceI commonDataServiceI) {
        this.commonDataServiceI = commonDataServiceI;
    }

    @GetMapping("/available-privileges/{id}")
    public ResponseEntity<List<CommonDataDto>> getAvailablePrivilegesByGroupID(@PathVariable int id) {
        return ResponseEntity.ok(commonDataServiceI.getAvailablePrivilegesByGroupID(id));
    }

    @GetMapping("/assigned-privileges/{id}")
    public ResponseEntity<List<CommonDataDto>> getAssignedPrivilegesByGroupID(@PathVariable int id) {
        return ResponseEntity.ok(commonDataServiceI.getAssignedPrivilegesByGroupID(id));
    }

    @PostMapping("/group-privileges/{id}")
    public ResponseEntity<CommonDataListDto> saveData(
            @RequestBody CommonDataListDto commonDataListDto,
            @PathVariable int id) {
        return ResponseEntity.ok(commonDataServiceI.saveData(id, commonDataListDto));
    }

    @GetMapping("/group-available-users/{id}")
    public ResponseEntity<List<CommonDataDto>> getAvailableUsersByGroupID(@PathVariable int id) {
        return ResponseEntity.ok(commonDataServiceI.getAvailableUsersByGroupID(id));
    }

    @GetMapping("/group-assigned-users/{id}")
    public ResponseEntity<List<CommonDataDto>> getAssignedUsersByGroupID(@PathVariable int id) {
        return ResponseEntity.ok(commonDataServiceI.getAssignedUsersByGroupID(id));
    }

    @PostMapping("/privilege-group-users/{id}")
    public ResponseEntity<CommonDataListDto> saveGroupUserData(
            @RequestBody CommonDataListDto commonDataListDto,
            @PathVariable int id) {
        return ResponseEntity.ok(commonDataServiceI.saveGroupUserData(id, commonDataListDto));
    }
}
