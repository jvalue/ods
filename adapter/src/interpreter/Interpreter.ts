export abstract class Interpreter {
  type: string | undefined;
  description: string | undefined;
  parameters: Record<string, unknown> | undefined;


  interpret(data: string, parameters: Record<string, unknown>): string { //throws IOException
    this.validateParameters(parameters);
    return this.doInterpret(data, parameters);
  }

  abstract doInterpret(data: string, parameters: Record<string, unknown>): string //throws IOException;

  validateParameters(inputParameters: Record<string, unknown>) { //throws InterpreterParameterException
    /*boolean illegalArguments = false;
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
      }*/
    }
  }
