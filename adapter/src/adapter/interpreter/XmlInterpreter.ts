import { XMLParser } from 'fast-xml-parser';

import { Interpreter } from './Interpreter';

export class XmlInterpreter extends Interpreter {
  constructor() {
    super('XML', 'Interpret data as XML data', []);
  }

  /**
   * Interpretes the xml data
   * Uses fast-xml-parser library to convert the xml to corresponding json object
   *
   * @param data string representation of the xml data
   * @param parameters currently for xml interpretation not needed
   * @returns JSON string representation as Promise
   */
  override doInterpret(
    data: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parameters: Record<string, unknown>,
  ): Promise<Record<string, unknown> | Array<Record<string, unknown>>> {
    const options = {
      ignoreDeclaration: true,
    };

    const parser = new XMLParser(options);
    const result = parser.parse(data) as Record<string, unknown>;
    return Promise.resolve(result);
  }
}
