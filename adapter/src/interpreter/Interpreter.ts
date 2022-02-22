export abstract class Interpreter {
  type: string | undefined;
  description: string | undefined;
  parameters: Map<string, any> | undefined;

  /*
    interpret(data: string, parameters: Map<string, any>): JsonNode { //throws IOException
      validateParameters(parameters);
      return doInterpret(data, parameters);
      return null
    }

    abstract doInterpret(data: string, parameters: Map<string, any>): JsonNode //throws IOException;

    validateParameters(inputParameters: Map<string, any>): JsonNode { //throws InterpreterParameterException
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
          throw new InterpreterParameterException(illegalArgumentsMessage);
        }
      }

  }

  /*

    protected void validateParameters(Map<String, Object> inputParameters) throws InterpreterParameterException {

    }

  */
}
