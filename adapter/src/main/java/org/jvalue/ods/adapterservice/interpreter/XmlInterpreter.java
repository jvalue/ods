package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class XmlInterpreter extends Interpreter {

    private final List<InterpreterParameterDescription> parameters =  Collections.unmodifiableList(List.of());
    private final XmlMapper mapper = new XmlMapper();

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
        return mapper.readTree(data);
    }
}
