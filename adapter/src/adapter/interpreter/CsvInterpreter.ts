import {Interpreter} from "./Interpreter";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";
const csv=require('csvtojson')


export class CsvInterpreter extends Interpreter {

  type: string = "CSV"
  description: string = "Interpret data as CSV data"
  parameters: InterpreterParameterDescription[] = [new InterpreterParameterDescription("columnSeparator", "Column delimiter character, only one character supported", "string"),
                                                  new InterpreterParameterDescription("lineSeparator", "Line delimiter character, only \\r, \\r\\n, and \\n supported", "string",),
                                                  new InterpreterParameterDescription("skipFirstDataRow", "Skip first data row (after header)", "boolean"),
                                                  new InterpreterParameterDescription("firstRowAsHeader", "Interpret first row as header for columns", "boolean")]

                                                  
  

  override getType(): string {
    return this.type
  }
  override getDescription(): string {
    return this.description
  }
  override getAvailableParameters(): InterpreterParameterDescription[] {
    return this.parameters;
  }

  override doInterpret(data: string, parameters: Record<string, unknown>): Promise<string> {
    let columnSeparator = (parameters.columnSeparator as string).charAt(0)
    let lineSeparator: string = parameters.lineSeparator as string;
    let firstRowAsHeader: boolean = parameters.firstRowAsHeader as boolean; // True = With header, False = WithoutHeader
    let skipFirstDataRow: boolean = parameters.skipFirstDataRow as boolean;
    
    let json: any[] = [];
    let count = 0;
    csv({
      noheader: !firstRowAsHeader, // Be Careful: Need to Invert the boolean here
      output: "json",
      delimiter: columnSeparator,
      eol: lineSeparator
    })
    .fromString(data)
    .then((csvRow: any)=>{
      // Todo need to test if this works 
      if(skipFirstDataRow && ((count == 0 && !firstRowAsHeader) || (count == 1 && firstRowAsHeader))) {
        // Skip First Row
      }
      else {      
        json.push(csvRow);
      }

      count = count+1;
    })
    return new Promise(function(resolve, reject){
        resolve(JSON.stringify(json));
      });
  }

  override validateParameters(inputParameters: Record<string, unknown>): void {
      super.validateParameters(inputParameters);
      let lineSeparator: string = inputParameters.lineSeparator as string;

      if (lineSeparator !== "\n" && lineSeparator !== "\r" && lineSeparator !== "\r\n") {
        throw new Error(this.getType() + " interpreter requires parameter lineSeparator to have" +
          " value \\n, \\r, or \\r\\n. Your given value " + lineSeparator + " is invalid!");
      }

      var columnSeparator: string = inputParameters.columnSeparator as string;
      if (columnSeparator.length !== 1) {
      throw new Error(this.getType() + " interpreter requires parameter columnSeparator to have" +
        " length 1. Your given value " + columnSeparator + " is invalid!");
    }
  }
}
