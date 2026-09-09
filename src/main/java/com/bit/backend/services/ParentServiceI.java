package com.bit.backend.services;

import com.bit.backend.dtos.ParentDto;

import java.util.List;

public interface ParentServiceI {
    ParentDto addParent(ParentDto parentDto);
    List<ParentDto> getAllParents();
    ParentDto getParentById(long id);
    ParentDto updateParent(long id, ParentDto parentDto);
    ParentDto deleteParent(long id);
}
