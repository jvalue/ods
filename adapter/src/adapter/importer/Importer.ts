import { ImporterParameterDescription } from "./ImporterParameterDescription";
import { ImporterParameterError } from "../model/exceptions/ImporterParameterError";

export abstract class Importer {
  type: string | undefined;
  description: string | undefined;

  getRequiredParameters(): Array<ImporterParameterDescription> {
    return this.getAvailableParameters().filter((item: any) => item.required) as Array<ImporterParameterDescription>
  }

  //@JsonProperty("parameters")
  abstract getAvailableParameters() :Array<ImporterParameterDescription>;

  fetch(parameters:Map<string, unknown> ): string { //throws ImporterParameterException
      this.validateParameters(parameters);
      return this.doFetch(parameters);
  }

  abstract getType(): string;
  abstract getDescription(): string;

  abstract doFetch(parameters: Map<string, unknown>): string; //throws ImporterParameterException

  validateParameters(inputParameters: Map<string, unknown>) { //throws ImporterParameterException;

    let illegalArguments: boolean = false;
    let illegalArgumentsMessage: string = "";

    let possibleParameters: Array<ImporterParameterDescription> = this.getAvailableParameters();
    // TODO is that OK?
    let unnecessaryArguments = Array.from(inputParameters.values()).filter((item: any) => possibleParameters.includes(item))
    if(unnecessaryArguments.length > 0){
      illegalArguments = true;
      for(let argument of unnecessaryArguments){
        illegalArgumentsMessage += argument + " is not needed by importer \n"
      }
    }
    for (let requiredParameter of this.getRequiredParameters()){
      if (inputParameters.get(requiredParameter.name) == null){
        illegalArguments = true;
        illegalArgumentsMessage = illegalArgumentsMessage + this.type + "importer requires parameter " + requiredParameter.name + "\n";
      }
      // TODO is that OK?
      else if((inputParameters.get(requiredParameter.name) as any).constructor.name != requiredParameter.type){
        illegalArguments = true;
        illegalArgumentsMessage = illegalArgumentsMessage + this.type + " importer requires parameter "
            + requiredParameter.name + " to be type " + (requiredParameter.type as string) + "\n";
      }
    }
    if(illegalArguments){
      throw new ImporterParameterError(illegalArgumentsMessage);
    }
  }
}