package org.jvalue.ods.adapterservice.adapter.interpreter;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class JsonInterpreterTest {
  private final Interpreter interpreter = new JsonInterpreter();
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void interpretJsonData() throws IOException {
    var jsonString = "{\"attribute\":\"value\"}";

    var result = interpreter.interpret(jsonString, Map.of());
    assertEquals(jsonString, result.toString());
  }

  @Test
  public void interpretMalformedData() {
    assertThrows(IOException.class, () ->
      interpreter.interpret("<this><is>no json</is></this>", Map.of())
    );
  }

  @Test
  public void testSerialization() throws IOException {
    var expected = mapper.readTree("{\"type\":\"JSON\",\"description\":\"Interpret data as JSON data\",\"parameters\":[]}");
    var result = mapper.valueToTree(interpreter);

    assertEquals(expected, result);
  }

}
