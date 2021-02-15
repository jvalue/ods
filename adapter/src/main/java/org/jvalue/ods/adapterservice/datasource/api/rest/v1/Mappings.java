package org.jvalue.ods.adapterservice.datasource.api.rest.v1;

import java.util.Map;

import org.jvalue.ods.adapterservice.adapter.model.exceptions.*;
import org.jvalue.ods.adapterservice.datasource.model.exceptions.*;
import org.springframework.http.HttpStatus;

public class Mappings {
  public static final String DATA_PATH = "/data";
  public static final String DATASOURCE_PATH = "/datasources";
  public static final String DATAIMPORT_PATH = "/imports";
  public static final String LATEST_PATH = "/latest";

  public static final Map<Class, HttpStatus> ERROR_MAPPING = Map.of(
    DataImportNotFoundException.class, HttpStatus.NOT_FOUND,
    DatasourceNotFoundException.class, HttpStatus.NOT_FOUND,
    DataImportLatestNotFoundException.class, HttpStatus.NOT_FOUND,
    ImporterParameterException.class, HttpStatus.BAD_REQUEST,
    InterpreterParameterException.class, HttpStatus.BAD_REQUEST,
    IllegalArgumentException.class, HttpStatus.BAD_REQUEST
  );
}
