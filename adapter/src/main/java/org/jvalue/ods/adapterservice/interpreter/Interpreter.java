package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public abstract class Interpreter {
    protected ObjectMapper mapper = new ObjectMapper();
    public abstract String type();

    public abstract JsonNode interpret(Object fetch);
}
