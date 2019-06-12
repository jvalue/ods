package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;

public class JsonInterpreter extends Interpreter {
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String getType() {
        return "JSON";
    }

    @Override
    public JsonNode interpret(String fetch) throws IOException {
        return mapper.readTree(fetch);
    }
}
