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
    // TODO probably should be reworked (string is a json, BUT NOT STRINGIFIED -> JSON.parse fails)
    // TODO by looking at old impl tests, the tests are wrong (should be stringified)
    let parsedData = {};
    if (data !== '') {
      try {
        // Try to parse data
        parsedData = JSON.parse(data) as Record<string, unknown>;
      } catch (e) {
        // Parsing failed -> try again in case string was not stringified
        parsedData = JSON.parse(JSON.stringify(data)) as Record<
          string,
          unknown
        >;
      }
    }
    return Promise.resolve(parsedData);
  }
}
