package org.jvalue.ods.adapterservice.adapter.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import org.junit.jupiter.api.Test;
import org.jvalue.ods.adapterservice.adapter.model.exceptions.InterpreterParameterException;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class CsvInterpreterTest {
  private final Interpreter interpreter = new CsvInterpreter();
  private static final String CSV_STRING = "1;2;sadf\n5;3;fasd";
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void interpretSimpleCSVData() throws IOException, InterpreterParameterException {
    JsonNode result = interpreter.interpret(CSV_STRING, Map.of(
      "columnSeparator", ";",
      "lineSeparator", "\n",
      "skipFirstDataRow", false,
      "firstRowAsHeader", false
    ));

    assertEquals(JsonNodeType.ARRAY, result.getNodeType());

    assertEquals(2, result.size());

    // first row
    assertEquals(3, result.get(0).size());
    assertEquals("1", result.get(0).get(0).asText());
    assertEquals("2", result.get(0).get(1).asText());
    assertEquals("sadf", result.get(0).get(2).asText());

    // second row
    assertEquals(3, result.get(1).size());
    assertEquals("5", result.get(1).get(0).asText());
    assertEquals("3", result.get(1).get(1).asText());
    assertEquals("fasd", result.get(1).get(2).asText());
  }

  @Test
  public void interpretCSVDataOtherColumnSeparator() throws IOException, InterpreterParameterException {
    String csv = CSV_STRING.replace(';', '&');
    JsonNode result = interpreter.interpret(csv, Map.of(
      "columnSeparator", "&",
      "lineSeparator", "\n",
      "skipFirstDataRow", false,
      "firstRowAsHeader", false
    ));

    assertEquals(JsonNodeType.ARRAY, result.getNodeType());

    assertEquals(2, result.size());
    assertEquals(3, result.get(0).size());
    assertEquals(3, result.get(1).size());
  }

  @Test
  public void interpretCSVDataOtherLineSeparator() throws IOException, InterpreterParameterException {
    String csv = CSV_STRING.replace('\n', '\r');
    JsonNode result = interpreter.interpret(csv, Map.of(
      "columnSeparator", ";",
      "lineSeparator", "\r",
      "skipFirstDataRow", false,
      "firstRowAsHeader", false
    ));

    assertEquals(JsonNodeType.ARRAY, result.getNodeType());

    assertEquals(2, result.size());
    assertEquals(3, result.get(0).size());
    assertEquals(3, result.get(1).size());
  }

  @Test
  public void interpretCSVDataSkipFirstRow() throws IOException, InterpreterParameterException {
    JsonNode result = interpreter.interpret(CSV_STRING, Map.of(
      "columnSeparator", ";",
      "lineSeparator", "\n",
      "skipFirstDataRow", true,
      "firstRowAsHeader", false
    ));

    assertEquals(JsonNodeType.ARRAY, result.getNodeType());

    assertEquals(1, result.size());

    // first row
    assertEquals(3, result.get(0).size());
    assertEquals("5", result.get(0).get(0).asText());
    assertEquals("3", result.get(0).get(1).asText());
    assertEquals("fasd", result.get(0).get(2).asText());
  }

  @Test
  public void interpretCSVDataHeaderRow() throws IOException, InterpreterParameterException {
    String csv = "1;2;sadf\n5;3;fasd";
    JsonNode result = interpreter.interpret(csv, Map.of(
      "columnSeparator", ";",
      "lineSeparator", "\n",
      "skipFirstDataRow", false,
      "firstRowAsHeader", true
    ));

    assertEquals(JsonNodeType.ARRAY, result.getNodeType());

    assertEquals(1, result.size());

    // first row
    assertEquals(3, result.get(0).size());
    assertEquals("5", result.get(0).get("1").asText());
    assertEquals("3", result.get(0).get("2").asText());
    assertEquals("fasd", result.get(0).get("sadf").asText());
  }

  @Test
  public void interpretMissingParameters() {
    assertThrows(InterpreterParameterException.class, () ->
      interpreter.interpret("{\"this is\":\"no CSV\"", Map.of())
    );
  }

  @Test
  public void interpretWrongParameterType() {
    assertThrows(InterpreterParameterException.class, () ->
      interpreter.interpret(CSV_STRING, Map.of(
        "columnSeparator", ",",
        "lineSeparator", ";",
        "skipFirstDataRow", false,
        "firstRowAsHeader", 123 // should be boolean!
      ))
    );
  }

  @Test
  public void interpretInvalidLineSeparator() {
    assertThrows(InterpreterParameterException.class, () ->
      interpreter.interpret(CSV_STRING, Map.of(
        "columnSeparator", ",",
        "lineSeparator", "&", // only \n, \r, or \r\n
        "skipFirstDataRow", false,
        "firstRowAsHeader", false
      ))
    );
  }

  @Test
  public void interpretInvalidColumnSeparator() {
    assertThrows(InterpreterParameterException.class, () ->
      interpreter.interpret(CSV_STRING, Map.of(
        "columnSeparator", ",asd",  // only one char
        "lineSeparator", "\n",
        "skipFirstDataRow", false,
        "firstRowAsHeader", false
      ))
    );
  }


  @Test
  public void testSerialization() throws IOException {
    JsonNode expected = mapper.readTree("""
      {
        "type":"CSV",
        "description":"Interpret data as CSV data",
        "parameters":[
          {"name":"columnSeparator","description":"Column delimiter character, only one character supported","type":"java.lang.String"},
          {"name":"lineSeparator","description":"Line delimiter character, only \\\\r, \\\\r\\\\n, and \\\\n supported","type":"java.lang.String"},
          {"name":"skipFirstDataRow","description":"Skip first data row (after header)","type":"java.lang.Boolean"},
          {"name":"firstRowAsHeader","description":"Interpret first row as header for columns","type":"java.lang.Boolean"}
        ]
      }""");
    JsonNode result = mapper.valueToTree(interpreter);

    assertEquals(expected, result);
  }

}
