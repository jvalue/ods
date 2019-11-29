package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import org.junit.Test;

import java.io.IOException;
import java.util.Map;

import static org.junit.Assert.assertEquals;

public class CsvInterpreterTest {
    private final Interpreter interpreter = new CsvInterpreter();
    private static final String CSV_STRING = "1;2;sadf\n5;3;fasd";
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    public void interpretCSVData() throws IOException {
        JsonNode result = interpreter.interpret(CSV_STRING, Map.of(
                "columnSeparator", ';',
                "lineSeparator", "/n",
                "skipFirstDataRow", false,
                "firstRowAsHeader", false
        ));

        assertEquals(JsonNodeType.ARRAY, result.getNodeType());
        final ArrayNode results = (ArrayNode) result;

        JsonNode row = results.get(0);
        // TODO
    }

    @Test(expected = IllegalArgumentException.class)
    public void interpretMissingParameters() throws IOException {
        interpreter.interpret("{\"this is\":\"no CSV\"", Map.of());
    }

    @Test(expected = IllegalArgumentException.class)
    public void interpretWrongParameterType() throws IOException {
        interpreter.interpret("{\"this is\":\"no CSV\"", Map.of("columnSeparator", "String"));
    }

    @Test
    public void testSerialization() throws IOException {
        JsonNode expected = mapper.readTree("{\"type\":\"CSV\"," +
                "\"description\":\"Interpret data as CSV data\"," +
                "\"parameters\":[" +
                "{\"name\":\"columnSeparator\",\"description\":\"Column delimiter character\",\"type\":\"java.lang.Character\"}," +
                "{\"name\":\"lineSeparator\",\"description\":\"Line delimiter character\",\"type\":\"java.lang.String\"}," +
                "{\"name\":\"skipFirstDataRow\",\"description\":\"Skip first data row (after header)\",\"type\":\"java.lang.Boolean\"}," +
                "{\"name\":\"firstRowAsHeader\",\"description\":\"Interpret first row as header for columns\",\"type\":\"java.lang.Boolean\"}" +
                "]}");
        JsonNode result = mapper.valueToTree(interpreter);

        assertEquals(expected, result);
    }

}
