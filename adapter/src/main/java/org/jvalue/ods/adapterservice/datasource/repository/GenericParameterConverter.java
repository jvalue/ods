package org.jvalue.ods.adapterservice.datasource.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.AttributeConverter;
import java.io.IOException;
import java.util.Map;

/**
 * Serialize and deserialize map of objects (e.g. parameters) as a string
 */
public class GenericParameterConverter implements AttributeConverter<Map<String, Object>, String> {

  private ObjectMapper objectMapper = new ObjectMapper();
  private final Logger logger = LoggerFactory.getLogger(GenericParameterConverter.class);

  @Override
  public String convertToDatabaseColumn(Map<String, Object> parameters) {
    String parametersJson = null;
    try {
      parametersJson = objectMapper.writeValueAsString(parameters);
    } catch (final JsonProcessingException e) {
      logger.error("JSON serialization error", e);
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
      logger.error("JSON deserialization error", e);
    }
    return parameters;
  }
}
