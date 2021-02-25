package org.jvalue.ods.adapterservice.datasource.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import javax.persistence.AttributeConverter;
import java.io.IOException;
import java.util.Map;

/**
 * Serialize and deserialize map of objects (e.g. parameters) as a string
 */
@Slf4j
public class GenericParameterConverter implements AttributeConverter<Map<String, Object>, String> {
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Override
  public String convertToDatabaseColumn(Map<String, Object> parameters) {
    String parametersJson = null;
    try {
      parametersJson = objectMapper.writeValueAsString(parameters);
    } catch (final JsonProcessingException e) {
      log.error("JSON serialization error", e);
    }
    return parametersJson;
  }

  @Override
  @SuppressWarnings("unchecked")
  public Map<String, Object> convertToEntityAttribute(String parametersJson) {
    Map<String, Object> parameters = null;
    try {
      parameters = objectMapper.readValue(parametersJson, Map.class);
    } catch (final IOException e) {
      log.error("JSON deserialization error", e);
    }
    return parameters;
  }
}
