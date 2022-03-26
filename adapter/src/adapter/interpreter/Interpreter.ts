import { stringifiers } from "@jvalue/node-dry-basics";
import { InterpreterParameterError } from "../model/exceptions/InterpreterParameterError";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";

export abstract class Interpreter {
  type: string | undefined;
  description: string | undefined;


  interpret(data: string, parameters: Record<string, unknown>): string {
    this.validateParameters(parameters);
    return this.doInterpret(data, parameters);
  }

  abstract getType(): string;
  abstract getDescription(): string;
  abstract doInterpret(data: string, parameters: Record<string, unknown>): string
  abstract getAvailableParameters(): Array<InterpreterParameterDescription>;

  validateParameters(inputParameters: Record<string, unknown>) { 
    let illegalArguments: boolean = false;
    let illegalArgumentsMessage: string = "";
    
    for (let requiredParameter of this.getAvailableParameters()){
      if ((inputParameters.requiredParameter as InterpreterParameterDescription).name == null){
        illegalArguments = true;
        illegalArgumentsMessage = illegalArgumentsMessage + this.type + "interpreter requires parameter " + requiredParameter.name + "\n";
      }
      // TODO is that OK?
      /*else if(((inputParameters.requiredParameter as InterpreterParameterDescription).name) as any)).constructor.name != requiredParameter.type){
        illegalArguments = true;
        illegalArgumentsMessage = illegalArgumentsMessage + this.type + " interpreter requires parameter "
            + requiredParameter.name + " to be type " + (requiredParameter.type as string) + "\n";
      }*/
    }
    if(illegalArguments){
      throw new InterpreterParameterError(illegalArgumentsMessage);
    }
  }
}
