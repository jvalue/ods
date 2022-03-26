import { ImporterParameterDescription } from "./ImporterParameterDescription";
import { ImporterParameterError } from "../model/exceptions/ImporterParameterError";
import { generateKeySync } from "crypto";

export abstract class Importer {
  type: string | undefined;
  description: string | undefined;

  getRequiredParameters(): Array<ImporterParameterDescription> {
    return this.getAvailableParameters().filter((item: any) => item.required) as Array<ImporterParameterDescription>
  }

  //@JsonProperty("parameters")
  abstract getAvailableParameters() :Array<ImporterParameterDescription>;

  fetch(parameters:Record<string, unknown> ): string { //throws ImporterParameterException
      this.validateParameters(parameters);
      return this.doFetch(parameters);
  }

  abstract getType(): string;
  abstract getDescription(): string;

  abstract doFetch(parameters: Record<string, unknown>): string; //throws ImporterParameterException

  validateParameters(inputParameters: Record<string, unknown>) { //throws ImporterParameterException;

    let illegalArguments: boolean = false;
    let illegalArgumentsMessage: string = "";

    let possibleParameters: Array<ImporterParameterDescription> = this.getAvailableParameters();

    let unnecessaryArguments = [];
    let names = possibleParameters.map(a => a.name);
    const keys = Object.keys(inputParameters);

    for (let entry of keys) {
      if(!names.includes(entry)) {
        unnecessaryArguments.push(entry);
      }
    }

    if(unnecessaryArguments.length > 0){
      illegalArguments = true;
      for(let argument of unnecessaryArguments){
        illegalArgumentsMessage += argument + " is not needed by importer \n"
      }
    }
    let requiredParameters = this.getRequiredParameters()
    for (let requiredParameter of requiredParameters){
      // TODO is that OK?
      let checkType = (inputParameters[requiredParameter.name] as any).constructor.name
      if (inputParameters[requiredParameter.name] == null){
        illegalArguments = true;
        illegalArgumentsMessage = illegalArgumentsMessage + this.type + "importer requires parameter " + requiredParameter.name + "\n";
      }
      
      else if(checkType.toLowerCase() != requiredParameter.type){
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
