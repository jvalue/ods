package org.jvalue.ods.adapterservice.adapter.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public class XmlInterpreter extends Interpreter {

  private final List<InterpreterParameterDescription> parameters = List.of();
  private final XmlMapper mapper = new XmlMapper();

  public XmlInterpreter() {
    mapper.registerModule(new SimpleModule().addDeserializer(Object.class, new UntypedXMLArrayDeserializer()));
  }

  @Override
  public String getType() {
    return "XML";
  }

  @Override
  public String getDescription() {
    return "Interpret data as XML data";
  }

  @Override
  public List<InterpreterParameterDescription> getAvailableParameters() {
    return parameters;

  }

  @Override
  public JsonNode doInterpret(String data, Map<String, Object> parameters) throws IOException {
    Object result = mapper.readValue(data, Object.class);
    return mapper.valueToTree(result);
  }
}
