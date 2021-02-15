package org.jvalue.ods.adapterservice.adapter.api.rest.v1;

import java.io.IOException;
import java.util.Map;

import org.jvalue.ods.adapterservice.adapter.model.exceptions.*;
import org.springframework.http.HttpStatus;

public class Mappings {
  public static final String IMPORT_PATH = "/preview";
  public static final String RAW_IMPORT_PATH = "/preview/raw";
  public static final String FORMAT_PATH = "/formats";
  public static final String PROTOCOL_PATH = "/protocols";
  public static final String VERSION_PATH = "/version";

  public static final Map<Class, HttpStatus> ERROR_MAPPING = Map.of(
    ImporterParameterException.class,     HttpStatus.BAD_REQUEST,
    InterpreterParameterException.class,  HttpStatus.BAD_REQUEST,
    IllegalArgumentException.class,       HttpStatus.BAD_REQUEST,
    IOException.class,                    HttpStatus.INTERNAL_SERVER_ERROR
  );
}
