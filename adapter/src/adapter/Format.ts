import { CsvInterpreter } from './interpreter/CsvInterpreter';
import { Interpreter } from './interpreter/Interpreter';
import { JsonInterpreter } from './interpreter/JsonInterpreter';
import { XmlInterpreter } from './interpreter/XmlInterpreter';

export class Format {
  static readonly JSON = new JsonInterpreter();
  static readonly XML = new XmlInterpreter();
  static readonly CSV = new CsvInterpreter();

  interpreter: Interpreter;
  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }

  getInterpreter(): Interpreter {
    return this.interpreter;
  }
}
