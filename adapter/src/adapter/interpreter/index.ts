import { CsvInterpreter } from './CsvInterpreter';
import { JsonInterpreter } from './JsonInterpreter';
import { XmlInterpreter } from './XmlInterpreter';

export * from './Interpreter';

export const Format = {
  JSON: new JsonInterpreter(),
  XML: new XmlInterpreter(),
  CSV: new CsvInterpreter(),
};
