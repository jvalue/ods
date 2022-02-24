export abstract class Importer {
  type: string | undefined;
  description: string | undefined;
  parameters: Record<string, unknown> | undefined;
/**
 * 
 *  public abstract String getType();

  public abstract String getDescription();

  @JsonProperty("parameters")
  public abstract List<ImporterParameterDescription> getAvailableParameters();

  protected List<ImporterParameterDescription> getRequiredParameters() {
    return getAvailableParameters().stream()
      .filter(ImporterParameterDescription::isRequired).collect(Collectors.toList());
  }

  public final String fetch(Map<String, Object> parameters) throws ImporterParameterException {
    validateParameters(parameters);
    return doFetch(parameters);
  }

  protected abstract String doFetch(Map<String, Object> parameters) throws ImporterParameterException;

  protected void validateParameters(Map<String, Object> inputParameters) throws ImporterParameterException {
    boolean illegalArguments = false;
    String illegalArgumentsMessage = "";


    List<String> possibleParameters = getAvailableParameters().stream()
      .map(ImporterParameterDescription::getName).collect(Collectors.toList());
    var unnecessaryArguments = inputParameters.keySet().stream()
      .filter(o -> !possibleParameters.contains(o)).collect(Collectors.toList());
    if (unnecessaryArguments.size() > 0) {
      illegalArguments = true;
      for (var argument :
        unnecessaryArguments) {
        illegalArgumentsMessage += argument + " is not needed by importer \n";
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
      throw new ImporterParameterException(illegalArgumentsMessage);
    }
     */
}