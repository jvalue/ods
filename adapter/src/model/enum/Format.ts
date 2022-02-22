import { CsvInterpreter } from "../../interpreter/CsvInterpreter";
import { JsonInterpreter } from "../../interpreter/JsonInterpreter";
import { XmlInterpreter } from "../../interpreter/XmlInterpreter";


export class Format {
  static readonly JSON  = new JsonInterpreter();
  static readonly XML = new XmlInterpreter();
  static readonly CSV  = new CsvInterpreter();

  // private to disallow creating other instances of this type
  private constructor(private readonly key: string, public readonly value: any) {
  }

  toString() {
    return this.key;
  }
}

/*
JSON(new JsonInterpreter()),
  XML(new XmlInterpreter()),
  CSV(new CsvInterpreter());

  private final Interpreter interpreter;

  Format(Interpreter interpreter) {
    this.interpreter = interpreter;
  }

  Interpreter getInterpreter() {
    return interpreter;
  }
*/
