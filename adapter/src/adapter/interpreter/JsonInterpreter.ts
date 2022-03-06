import {Interpreter} from "./Interpreter";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";

export class JsonInterpreter extends Interpreter {

  parameters: InterpreterParameterDescription[] = []

  override getType(): string {
    return "JSON";
  }
  
  override getDescription(): string {
    return "Interpret data as JSON data";
  }

  override getAvailableParameters(): InterpreterParameterDescription[] {
    return this.parameters;
  }

  override doInterpret(data: string, parameters: Map<string, unknown>): string {
    return JSON.parse(data);
  }
}
