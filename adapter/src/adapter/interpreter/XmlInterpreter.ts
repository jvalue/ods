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
    data =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<root><from>Rick</from><to>Morty</to>' +
      '<rasdasd><s>Rick</s><t>Morty</t></rasdasd></root>';

    const result = this.parseXmlToJson(data);
    const updatedResult: Record<string, unknown> = {};
    const resultKey: Record<string, unknown> = result[
      Object.keys(result)[0]
    ] as Record<string, unknown>;
    for (const [key, value] of Object.entries(resultKey)) {
      updatedResult[key] = value;
    }
    return new Promise(function (resolve) {
      resolve(updatedResult);
    });
  }

  parseXmlToJson(xml: string): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    for (const res of xml.matchAll(
      /(?:<(\w*)(?:\s[^>]*)*>)((?:(?!<\1).)*)(?:<\/\1>)|<(\w*)(?:\s*)*\/>/gm,
    )) {
      const key: string = res[1] || res[3];
      const value = res[2] && this.parseXmlToJson(res[2]);
      json[key] = (value && Object.keys(value).length ? value : res[2]) || null;
    }
    return json;
  }
}
