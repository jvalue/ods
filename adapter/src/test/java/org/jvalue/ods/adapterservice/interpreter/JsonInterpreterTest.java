package org.jvalue.ods.adapterservice.interpreter;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;


public class JsonInterpreterTest {
    private final Interpreter interpreter = new JsonInterpreter();
    private final ObjectMapper mapper = new ObjectMapper();
    private static final String MINIMAL_JSON = "{\"attribute\":\"value\"}";

    @Test
    public void interpretJsonData() throws IOException {
        JsonNode raw = mapper.readTree(MINIMAL_JSON);

        JsonNode result = interpreter.interpret(raw);

        assertEquals(MINIMAL_JSON, result.toString());
    }

}
