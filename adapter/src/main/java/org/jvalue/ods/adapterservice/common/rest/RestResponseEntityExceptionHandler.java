package org.jvalue.ods.adapterservice.common.rest;

import java.io.IOException;

import org.jvalue.ods.adapterservice.adapter.model.exceptions.*;
import org.jvalue.ods.adapterservice.datasource.model.exceptions.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@ControllerAdvice
public class RestResponseEntityExceptionHandler extends ResponseEntityExceptionHandler {
  
  @ExceptionHandler(value = {
    ImporterParameterException.class,
    InterpreterParameterException.class,
    IllegalArgumentException.class 
  })
  public ResponseEntity<Object> handleBadRequest(Exception ex, WebRequest req) {
    return handleExceptionInternal(ex, ex.getMessage(), new HttpHeaders(), HttpStatus.BAD_REQUEST, req);
  }

  @ExceptionHandler(value = {
    DataImportNotFoundException.class,
    DatasourceNotFoundException.class,
    DataImportLatestNotFoundException.class 
  })
  public ResponseEntity<Object> handleNotFound(Exception ex, WebRequest req) {
    return handleExceptionInternal(ex, ex.getMessage(), new HttpHeaders(), HttpStatus.NOT_FOUND, req);
  }

  @ExceptionHandler(value = {
    IOException.class
  })
  public ResponseEntity<Object> handleInternalServerError(Exception ex, WebRequest req) {
    return handleExceptionInternal(ex, ex.getMessage(), new HttpHeaders(), HttpStatus.INTERNAL_SERVER_ERROR, req);
  }
}
