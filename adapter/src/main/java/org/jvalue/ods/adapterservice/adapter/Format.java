package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.adapter.interpreter.*;

public enum Format {
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
}
