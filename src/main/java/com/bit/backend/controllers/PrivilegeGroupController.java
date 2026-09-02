package com.bit.backend.controllers;

import com.bit.backend.dtos.PrivilegeGroupDto;
import com.bit.backend.services.PrivilegeGroupServiceI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
public class PrivilegeGroupController {

    private final PrivilegeGroupServiceI privilegeGroupServiceI;

    public PrivilegeGroupController(PrivilegeGroupServiceI privilegeGroupServiceI) {
        this.privilegeGroupServiceI = privilegeGroupServiceI;
    }

    @GetMapping("/privilege-groups")
    public ResponseEntity<List<PrivilegeGroupDto>> getPrivilegeGroups() {
        return ResponseEntity.ok(privilegeGroupServiceI.getPrivilegeGroups());
    }

    @PostMapping("/privilege-groups")
    public ResponseEntity<PrivilegeGroupDto> addPrivilegeGroup(@RequestBody PrivilegeGroupDto privilegeGroupDto) {
        PrivilegeGroupDto created = privilegeGroupServiceI.addPrivilegeGroup(privilegeGroupDto);
        return ResponseEntity.created(URI.create("/privilege-groups/" + created.getId())).body(created);
    }

    @PutMapping("/privilege-groups/{id}")
    public ResponseEntity<PrivilegeGroupDto> updatePrivilegeGroup(
            @PathVariable long id,
            @RequestBody PrivilegeGroupDto privilegeGroupDto) {
        return ResponseEntity.ok(privilegeGroupServiceI.updatePrivilegeGroup(id, privilegeGroupDto));
    }

    /** Soft-delete: sets status = 0 so the group no longer grants privileges. */
    @DeleteMapping("/privilege-groups/{id}")
    public ResponseEntity<PrivilegeGroupDto> deletePrivilegeGroup(@PathVariable long id) {
        return ResponseEntity.ok(privilegeGroupServiceI.deletePrivilegeGroup(id));
    }
}
