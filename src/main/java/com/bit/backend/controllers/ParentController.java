package com.bit.backend.controllers;

import com.bit.backend.dtos.ApiListResponse;
import com.bit.backend.dtos.StatusDto;
import com.bit.backend.dtos.ParentDto;
import com.bit.backend.services.StatusServiceI;
import com.bit.backend.services.ParentServiceI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class ParentController {

    private final ParentServiceI parentServiceI;
    private final StatusServiceI statusServiceI;

    public ParentController(ParentServiceI parentServiceI, StatusServiceI statusServiceI) {
        this.parentServiceI = parentServiceI;
        this.statusServiceI = statusServiceI;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiListResponse<StatusDto>> getAllStatus() {
        return ResponseEntity.ok(ApiListResponse.of(statusServiceI.getAllStatus()));
    }

    @GetMapping("/parent")
    public ResponseEntity<ApiListResponse<ParentDto>> getAllParents() {
        return ResponseEntity.ok(ApiListResponse.of(parentServiceI.getAllParents()));
    }

    @GetMapping("/parent/{id}")
    public ResponseEntity<ApiListResponse<ParentDto>> getParentById(@PathVariable long id) {
        return ResponseEntity.ok(ApiListResponse.ofOne(parentServiceI.getParentById(id)));
    }

    @PostMapping("/parent")
    public ResponseEntity<ApiListResponse<ParentDto>> addParent(@RequestBody ParentDto parentDto) {
        ParentDto created = parentServiceI.addParent(parentDto);
        return ResponseEntity.created(URI.create("/api/v1/parent/" + created.getId()))
                .body(ApiListResponse.ofOne(created));
    }

    @PutMapping("/parent/{id}")
    public ResponseEntity<ApiListResponse<ParentDto>> updateParent(
            @PathVariable long id,
            @RequestBody ParentDto parentDto) {
        return ResponseEntity.ok(ApiListResponse.ofOne(parentServiceI.updateParent(id, parentDto)));
    }

    @DeleteMapping("/parent/{id}")
    public ResponseEntity<ApiListResponse<ParentDto>> deleteParent(@PathVariable long id) {
        return ResponseEntity.ok(ApiListResponse.ofOne(parentServiceI.deleteParent(id)));
    }

    @GetMapping("/parent/getClass/{courseId}")
    public ResponseEntity<ApiListResponse<Map<String, Object>>> getParentsForClass(@PathVariable long courseId) {
        List<Map<String, Object>> empty = Collections.emptyList();
        return ResponseEntity.ok(ApiListResponse.of(empty));
    }
}
