package org.jvalue.ods.adapterservice.importer;

import java.util.Map;
import java.util.Map.Entry;

import com.fasterxml.jackson.annotation.JsonProperty;

public abstract class Importer {

    public abstract String getType();
    public abstract String getDescription();

    @JsonProperty("parameters")
    public abstract Map<String, String> getAvailableParameters();

    public final String fetch(Map<String, Object> parameters) {
      validateParameters(parameters);
      return doFetch(parameters);
    }
    protected abstract String doFetch(Map<String, Object> parameters);

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
