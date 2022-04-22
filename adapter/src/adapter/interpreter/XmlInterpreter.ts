import { XMLParser } from 'fast-xml-parser';

import { Interpreter } from './Interpreter';
import { InterpreterParameterDescription } from './InterpreterParameterDescription';

export class XmlInterpreter extends Interpreter {
  type = 'XML';
  description = 'Interpret data as XML data';
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
    parameters: Record<string, unknown>,
  ): Promise<string> {
    const options = {
      ignoreDeclaration: true,
    };

    const parser = new XMLParser(options);
    const result = parser.parse(data) as Record<string, unknown>;
    const updatedResult: Record<string, unknown> = {};
    const resultKey: Record<string, unknown> = result[
      Object.keys(result)[0]
    ] as Record<string, unknown>;
    for (const [key, value] of Object.entries(resultKey)) {
      updatedResult[key] = value;
    }
    return new Promise(function (resolve) {
      resolve(JSON.stringify(updatedResult));
    });
  }
}
