package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.util.Map;
import java.util.Map.Entry;

public abstract class Interpreter {

    public abstract String getType();
    public abstract String getDescription();

    @JsonProperty("parameters")
    public abstract Map<String, String> getAvailableParameters();

    public final JsonNode interpret(String data, Map<String, Object> parameters) throws IOException {
      validateParameters(parameters);
      return doInterpret(data, parameters);
    }
    protected abstract JsonNode doInterpret(String data, Map<String, Object> parameters) throws IOException;

    protected void validateParameters(Map<String, Object> inputParameters) {
      boolean illegalArguments = false;
      String illegalArgumentsMessage = "";
      for(Entry<String, String> requiredParameter: getAvailableParameters().entrySet()) {
        if(inputParameters.get(requiredParameter.getKey()) == null) {
          illegalArguments = true;
          illegalArgumentsMessage = illegalArgumentsMessage + getType() + " importer requires parameter " + requiredParameter.getKey() + "/n";
        }
      }
      if(illegalArguments) {
        throw new IllegalArgumentException(illegalArgumentsMessage);
      }
    }
}
