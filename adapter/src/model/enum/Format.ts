import { JsonInterpreter } from "../../interpreter/JsonInterpreter";

export enum Format {
  JSON(new JsonInterpreter());
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
