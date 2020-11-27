package org.jvalue.ods.adapterservice.adapter.interpreter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.io.IOException;
import java.util.Collections;

import static org.junit.Assert.assertEquals;

public class RawInterpreterTest {
    private final Interpreter interpreter = new RawInterpreter();
    private final ObjectMapper mapper = new ObjectMapper();
    private static final String JSON_STRING = "{\"attribute\":\"value\"}";
    private static final String XML_STRING = "<note><to>Walter Frosch</to><body>Nice game!</body></note>";
    private static final String CSV_STRING = "1;2;sadf\n5;3;fasd";

    @Test
    public void interpretJsonData() throws IOException {
        String result = interpreter.interpret(JSON_STRING, Collections.emptyMap());

        assertEquals(JSON_STRING, result);
    }

    @Test
    public void interpretXmlData() throws IOException {
        String result = interpreter.interpret(XML_STRING, Collections.emptyMap());

        assertEquals(XML_STRING, result);
    }

    @Test
    public void interpretCsvData() throws IOException {
        String result = interpreter.interpret(CSV_STRING, Collections.emptyMap());

        assertEquals(CSV_STRING, result);
    }

    @Test
    public void testSerialization() throws JsonProcessingException {
        JsonNode result = mapper.valueToTree(interpreter);
        JsonNode expected = mapper.readTree("{\"description\":\"Do not change the original data format\",\"type\":\"RAW\",\"parameters\":[]}");

        assertEquals(expected, result);
    }
}
