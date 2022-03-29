import {Interpreter} from "./Interpreter";
import { InterpreterParameterDescription } from "./InterpreterParameterDescription";

export class JsonInterpreter extends Interpreter {

  type: string = "JSON"
  description: string = "Interpret data as JSON data"
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

  override doInterpret(data: string, parameters: Record<string, unknown>): string {
    return data;
  }
}