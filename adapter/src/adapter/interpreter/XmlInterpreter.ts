import {Interpreter} from "./Interpreter";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";
const xml2js = require('xml2js');

export class XmlInterpreter extends Interpreter{

  type: string = "XML"
  description: string = "Interpret data as XML data"
  parameters: InterpreterParameterDescription[] = []

  override getType(): string {
    return this.type
  }

  override getDescription(): string {
    return this.description
  }

  override getAvailableParameters(): InterpreterParameterDescription[] {
    return this.parameters;
  }

  // TODO @Georg check if this package can be used..
  override doInterpret(data: string, parameters: Map<string, unknown>): string {
    xml2js.parseString(data, (err: any, result: any) => {
      if(err) {
          throw err;
      }
  
      // `result` is a JavaScript object
      // convert it to a JSON string
      const json = JSON.stringify(result);
      return json;
    });
    throw Error("could not convert data into json");
  }
}
