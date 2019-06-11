package org.jvalue.ods.adapterservice.interpreter;


import com.fasterxml.jackson.databind.JsonNode;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;


public class JsonInterpreterTest {
    private final Interpreter interpreter = new JsonInterpreter();
    private static final String MINIMAL_JSON = "{\"attribute\":\"value\"}";

    @Test
    public void interpretJsonData() throws IOException {
        JsonNode result = interpreter.interpret(MINIMAL_JSON);

        assertEquals(MINIMAL_JSON, result.toString());
    }

    @Test(expected = IOException.class)
    public void interpretMalformedData() throws IOException {
        interpreter.interpret("<this><is>no json</is></this>");
    }

}
