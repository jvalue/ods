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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parameters: Record<string, unknown>,
  ): Promise<Record<string, unknown> | Array<Record<string, unknown>>> {
    if (data !== '') {
      const parsedData = JSON.parse(data) as Record<string, unknown>;
      return Promise.resolve(parsedData);
    }
    // Empty data -> resolve empty object (JSON.parse does not do that on its own)
    return Promise.resolve({});
  }
}
