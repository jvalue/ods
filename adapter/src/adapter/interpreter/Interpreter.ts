import { stringifiers } from "@jvalue/node-dry-basics";
import { InterpreterParameterError } from "../model/exceptions/InterpreterParameterError";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";

export abstract class Interpreter {
  type: string | undefined;
  description: string | undefined;
  parameters: Map<string, unknown> | undefined;


  interpret(data: string, parameters: Map<string, unknown>): string { //throws IOException
    this.validateParameters(parameters);
    return this.doInterpret(data, parameters);
  }

  abstract doInterpret(data: string, parameters: Map<string, unknown>): string //throws IOException;
  abstract getAvailableParameters(): Array<InterpreterParameterDescription>;

  validateParameters(inputParameters: Map<string, unknown>) { //throws InterpreterParameterException
    let illegalArguments: boolean = false;
    let illegalArgumentsMessage: string = "";
    
    for (let requiredParameter of this.getAvailableParameters()){
      if (inputParameters.get(requiredParameter.name) == null){
        illegalArguments = true;
        illegalArgumentsMessage = illegalArgumentsMessage + this.type + "interpreter requires parameter " + requiredParameter.name + "\n";
      }
      // TODO is that OK?
      else if((inputParameters.get(requiredParameter.name) as any).constructor.name != requiredParameter.type){
        illegalArguments = true;
        illegalArgumentsMessage = illegalArgumentsMessage + this.type + " interpreter requires parameter "
            + requiredParameter.name + " to be type " + (requiredParameter.type as string) + "\n";
      }
    }
    if(illegalArguments){
      throw new InterpreterParameterError(illegalArgumentsMessage);
    }
  }
}
