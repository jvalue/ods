package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;

public class XmlInterpreterTest {
    private final Interpreter interpreter = new XmlInterpreter();
    private static final String XML_STRING = "<note><to>Walter Frosch</to><body>Nice game!</body></note>";
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    public void interpretXmlData() throws IOException {
        JsonNode result = interpreter.interpret(XML_STRING);

        assertEquals(2, result.size());
        assertEquals("Walter Frosch", result.get("to").textValue());
        assertEquals("Nice game!", result.get("body").textValue());
    }

    @Test(expected = IOException.class)
    public void interpretMalformedData() throws IOException {
        interpreter.interpret("{\"this is\":\"no xml\"");
    }

    @Test
    public void testSerialization() throws IOException {
        JsonNode expected = mapper.readTree("{\"type\":\"XML\",\"parameters\":{}}");
        JsonNode result = mapper.valueToTree(interpreter);

        assertEquals(expected, result);
    }

}
