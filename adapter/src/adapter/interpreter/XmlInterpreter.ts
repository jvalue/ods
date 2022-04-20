import xml2js from 'xml2js';

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

  // TODO @Georg check if this package can be used..
  override doInterpret(
    data: string,
    parameters: Record<string, unknown>,
  ): Promise<string> {
    const parser = new xml2js.Parser({ explicitArray: false });

    return parser
      .parseStringPromise(data)
      .then(function (result: any) {
        // `result` is a JavaScript object
        // Convert it to a JSON string
        return result.root;
        // Const json = JSON.stringify(result.root);
        // Return json;
      })
      .catch(function (err: any) {
        throw err;
      });
  }
}
