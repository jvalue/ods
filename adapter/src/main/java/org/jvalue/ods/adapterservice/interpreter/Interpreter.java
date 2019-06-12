package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

public abstract class Interpreter {
    public final Map<String, String> parameters = Collections.EMPTY_MAP;

    public abstract String getType();

    public abstract JsonNode interpret(String fetch) throws IOException;
}
