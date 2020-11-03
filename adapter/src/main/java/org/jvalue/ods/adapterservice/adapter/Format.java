package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.adapter.interpreter.CsvInterpreter;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.interpreter.JsonInterpreter;
import org.jvalue.ods.adapterservice.adapter.interpreter.XmlInterpreter;

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
