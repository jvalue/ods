package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class JsonInterpreter extends Interpreter {
    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public String type() {
        return "JSON";
    }

    @Override
    public JsonNode interpret(Object fetch) {
        return mapper.valueToTree(fetch);
    }
}
