package com.bit.backend.config;

import com.bit.backend.dtos.ErrorDto;
import com.bit.backend.exceptions.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorDto> handleAppException(AppException appException) {
        return ResponseEntity.status(appException.getHttpStatus())
                .body(new ErrorDto(appException.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDto> handleGenericException(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorDto(exception.getMessage() != null ? exception.getMessage() : "Unexpected server error"));
    }
}
