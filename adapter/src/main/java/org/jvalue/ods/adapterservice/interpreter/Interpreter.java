package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;

public abstract class Interpreter {
    public abstract String type();

    public abstract JsonNode interpret(String fetch) throws IOException;
}
