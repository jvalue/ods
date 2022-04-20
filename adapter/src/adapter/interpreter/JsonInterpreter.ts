import { Interpreter } from './Interpreter';
import { InterpreterParameterDescription } from './InterpreterParameterDescription';

export class JsonInterpreter extends Interpreter {
  type = 'JSON';
  description = 'Interpret data as JSON data';
  parameters: InterpreterParameterDescription[] = [];

  override getType(): string {
    return this.type;
  }

  override getDescription(): string {
    return this.description;
  }

  override getAvailableParameters(): InterpreterParameterDescription[] {
    return this.parameters;
  }

  override doInterpret(
    data: string,
    _parameters: Record<string, unknown>,
  ): Promise<string> {
    return new Promise(function (resolve) {
      resolve(data);
    });
  }
}
