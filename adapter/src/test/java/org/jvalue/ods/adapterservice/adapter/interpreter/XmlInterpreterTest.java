package org.jvalue.ods.adapterservice.adapter.interpreter;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class XmlInterpreterTest {
  private final Interpreter interpreter = new XmlInterpreter();
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void interpretXmlData() throws IOException {
    var xmlString = "<note><to>Walter Frosch</to><body>Nice game!</body></note>";

    var result = interpreter.interpret(xmlString, Map.of());

    assertThat(result.toString()).isEqualToIgnoringWhitespace("""
      {"to": "Walter Frosch", "body": "Nice game!"}
      """
    );
  }

  @Test
  public void interpretXmlCollection() throws IOException {
    var collectionString = """
      <menuItems>
        <pizza>
          <price>2</price>
          <taste>good</taste>
        </pizza>
        <pizza>
          <price>12</price>
          <taste>disgusting</taste>
        </pizza>
      </menuItems>
      """;

    var result = interpreter.interpret(collectionString, Map.of());

    assertThat(result.toString()).isEqualToIgnoringWhitespace("""
      {"pizza": [
        {"price":"2","taste":"good"},
        {"price":"12","taste":"disgusting"}
      ]}
      """
    );
  }

  @Test
  public void interpretXmlCollectionNested() throws IOException {
    var collectionString = """
      <menuItems>
        <menu>
          <pizza>
            <price>2</price>
            <taste>good</taste>
          </pizza>
          <pizza>
            <price>12</price>
            <taste>disgusting</taste>
          </pizza>
        </menu>
      </menuItems>
      """;

    var result = interpreter.interpret(collectionString, Map.of());

    assertThat(result.toString()).isEqualToIgnoringWhitespace("""
      {"menu":
        {"pizza":[
          {"price":"2","taste":"good"},
          {"price":"12","taste":"disgusting"}
        ]}
      }
      """
    );
  }

  @Test
  public void interpretInconsistentXMLCollection() throws IOException {
    var collectionString = """
      <menuItems>
        <pizza>
          <type>funghi</type>
          <taste>good</taste>
        </pizza>
        <pizza>
          <price>12</price>
        </pizza>
      </menuItems>
      """;

    var result = interpreter.interpret(collectionString, Map.of());

    assertThat(result.toString()).isEqualToIgnoringWhitespace("""
      {"pizza": [
        {"type": "funghi","taste": "good"},
        {"price":"12"}
      ]}
      """
    );
  }

  @Test
  public void interpretMalformedData() {
    assertThrows(IOException.class, () ->
      interpreter.interpret("{\"this is\":\"no xml\"", Map.of())
    );
  }

  @Test
  public void testSerialization() throws IOException {
    var expected = mapper.readTree("{\"type\":\"XML\",\"description\":\"Interpret data as XML data\",\"parameters\":[]}");
    var result = mapper.valueToTree(interpreter);

    assertEquals(expected, result);
  }

}
