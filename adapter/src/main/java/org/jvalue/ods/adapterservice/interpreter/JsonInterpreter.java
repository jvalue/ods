package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

public class JsonInterpreter extends Interpreter {

  private final Map<String, String> parameters =  Collections.unmodifiableMap(Map.of());
  private final ObjectMapper mapper = new ObjectMapper();

  @Override
  public String getType() {
    return "JSON";
  }

  @Override
  public String getDescription() {
    return "Interpret data as JSON data";
  }

  @Override
  public Map<String, String> getAvailableParameters() {
    return parameters;
  }

  @Override
  protected JsonNode doInterpret(String data, Map<String, Object> parameters) throws IOException {
    return mapper.readTree(data);
  }
}
