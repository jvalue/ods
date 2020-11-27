package org.jvalue.ods.adapterservice.adapter.interpreter;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public abstract class Interpreter {

  public abstract String getType();

  public abstract String getDescription();

  @JsonProperty("parameters")
  public abstract List<InterpreterParameterDescription> getAvailableParameters();

  public final String interpret(String data, Map<String, Object> parameters) throws IOException {
    validateParameters(parameters);
    return doInterpret(data, parameters);
  }

  protected abstract String doInterpret(String data, Map<String, Object> parameters) throws IOException;

  protected void validateParameters(Map<String, Object> inputParameters) {
    boolean illegalArguments = false;
    String illegalArgumentsMessage = "";

    for (InterpreterParameterDescription requiredParameter : getAvailableParameters()) {
      if (inputParameters.get(requiredParameter.getName()) == null) {
        illegalArguments = true;
        illegalArgumentsMessage = illegalArgumentsMessage + getType() + " interpreter requires parameter "
          + requiredParameter.getName() + "/n";

      } else if (inputParameters.get(requiredParameter.getName()).getClass() != requiredParameter.getType()) {
        illegalArguments = true;
        illegalArgumentsMessage = illegalArgumentsMessage + getType() + " interpreter requires parameter "
            + requiredParameter.getName() + " to be type " + requiredParameter.getType().toString() + "/n";
      }
    }
    if (illegalArguments) {
      throw new IllegalArgumentException(illegalArgumentsMessage);
    }
  }
}
