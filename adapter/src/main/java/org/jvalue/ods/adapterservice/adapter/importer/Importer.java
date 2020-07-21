package org.jvalue.ods.adapterservice.adapter.importer;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonProperty;

public abstract class Importer {

    public abstract String getType();
    public abstract String getDescription();

    @JsonProperty("parameters")
    public abstract List<ImporterParameterDescription> getAvailableParameters();

    protected List<ImporterParameterDescription> getRequiredParameters() {
      return getAvailableParameters().stream()
        .filter(ImporterParameterDescription::isRequired).collect(Collectors.toList());
    }

    public final String fetch(Map<String, Object> parameters) {
      validateParameters(parameters);
      return doFetch(parameters);
    }
    protected abstract String doFetch(Map<String, Object> parameters);

    protected void validateParameters(Map<String, Object> inputParameters) {
      boolean illegalArguments = false;
      String illegalArgumentsMessage = "";

      var unnecessaryArguments = inputParameters.keySet().stream()
        .filter(o -> !getAvailableParameters().contains(o)).collect(Collectors.toList());
      if (unnecessaryArguments.size() > 0) {
        illegalArguments = true;
        for (var argument :
          unnecessaryArguments) {
          illegalArgumentsMessage +=  argument + " is not needed by importer \n";
        }
      }

      for (ImporterParameterDescription requiredParameter : getRequiredParameters()) {
        if (inputParameters.get(requiredParameter.getName()) == null) {
          illegalArguments = true;
          illegalArgumentsMessage = illegalArgumentsMessage + getType() + " importer requires parameter "
            + requiredParameter.getName() + "/n";

        } else if (inputParameters.get(requiredParameter.getName()).getClass() != requiredParameter.getType()) {
          illegalArguments = true;
          illegalArgumentsMessage = illegalArgumentsMessage + getType() + " importer requires parameter "
            + requiredParameter.getName() + " to be type " + requiredParameter.getType().toString() + "/n";
        }
      }
      if (illegalArguments) {
        throw new IllegalArgumentException(illegalArgumentsMessage);
      }
    }

}
