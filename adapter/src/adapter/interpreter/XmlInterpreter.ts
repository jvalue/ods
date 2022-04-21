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
    parameters: Record<string, unknown>,
  ): Promise<string> {
    /* Data =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<root><from>Rick</from><to>Morty</to>' +
      '<rasdasd><s>Rick</s><t>Morty</t></rasdasd></root>';s*/

    const result = this.convertXmlToJson(data);
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

  convertXmlToJson(inputData: string): Record<string, unknown> {
    const returnJson: Record<string, unknown> = {};
    for (const result of inputData.matchAll(
      /(?:<(\w*)(?:\s[^>]*)*>)((?:(?!<\1).)*)(?:<\/\1>)|<(\w*)(?:\s*)*\/>/gm,
    )) {
      const key: string = result[1] || result[3];
      const value = result[2] && this.convertXmlToJson(result[2]);
      returnJson[key] =
        (value && Object.keys(value).length ? value : result[2]) || null;
    }
    return returnJson;
  }
}
