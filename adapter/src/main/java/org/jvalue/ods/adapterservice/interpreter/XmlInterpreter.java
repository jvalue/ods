package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;

import java.io.IOException;

public class XmlInterpreter extends Interpreter {
    private final XmlMapper mapper = new XmlMapper();

    @Override
    public String getType() {
        return "XML";
    }

    @Override
    public JsonNode interpret(String fetch) throws IOException {
        return mapper.readTree(fetch);
    }
}
