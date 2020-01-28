package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.io.IOException;
import java.util.Map;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class XmlInterpreterTest {
    private final Interpreter interpreter = new XmlInterpreter();
    private static final String XML_STRING = "<note><to>Walter Frosch</to><body>Nice game!</body></note>";
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    public void interpretXmlData() throws IOException {
        JsonNode result = interpreter.interpret(XML_STRING, Map.of());

      System.out.println(result);
        assertEquals(2, result.size());
        assertEquals("Walter Frosch", result.get("to").textValue());
        assertEquals("Nice game!", result.get("body").textValue());
    }

    @Test
    public void interpretXmlCollection() throws IOException {
      final String collectionString =
        "<menuItems>" +
          "<pizza>" +
            "<price>2</price>" +
            "<taste>good</taste>" +
          "</pizza>" +
          "<pizza>" +
            "<price>12</price>" +
            "<taste>disgusting</taste>" +
          "</pizza>" +
        "</menuItems>";

      JsonNode result = interpreter.interpret(collectionString, Map.of());

      System.out.println(result);
      assertEquals(1, result.size());
      assertEquals(2, result.get("pizza").size());
      assertEquals(2, result.get("pizza").get(0).get("price").asInt());
      assertEquals("good", result.get("pizza").get(0).get("taste").asText());
      assertEquals(2, result.get("pizza").get(1).size());
      assertEquals(12, result.get("pizza").get(1).get("price").asInt());
      assertEquals("disgusting", result.get("pizza").get(1).get("taste").asText());
    }

  @Test
  public void interpretXmlCollectionNested() throws IOException {
    final String collectionString =
      "<menuItems>" +
        "<menu>" +
        "<pizza>" +
        "<price>2</price>" +
        "<taste>good</taste>" +
        "</pizza>" +
        "<pizza>" +
        "<price>12</price>" +
        "<taste>disgusting</taste>" +
        "</pizza>" +
        "</menu>" +
        "</menuItems>";

    JsonNode result = interpreter.interpret(collectionString, Map.of());

    System.out.println(result);
    assertEquals(1, result.size());
    assertEquals(1, result.get("menu").size());
    assertEquals(2, result.get("menu").get("pizza").get(0).get("price").asInt());
    assertEquals("good", result.get("menu").get("pizza").get(0).get("taste").asText());
    assertEquals(2, result.get("menu").get("pizza").get(1).size());
    assertEquals(12, result.get("menu").get("pizza").get(1).get("price").asInt());
    assertEquals("disgusting", result.get("menu").get("pizza").get(1).get("taste").asText());
  }

    @Test
    public void interpretInconsistentXMLCollection() throws IOException {
      final String collectionString =
        "<menuItems>" +
          "<pizza>" +
            "<type>funghi</type>" +
            "<taste>good</taste>" +
          "</pizza>" +
          "<pizza>" +
            "<price>12</price>" +
          "</pizza>" +
        "</menuItems>";

      JsonNode result = interpreter.interpret(collectionString, Map.of());

      System.out.println(result);
      assertEquals(1, result.size());
      assertEquals(2, result.get("pizza").size());
      assertEquals("funghi", result.get("pizza").get(0).get("type").asText());
      assertEquals("good", result.get("pizza").get(0).get("taste").asText());
      assertEquals(1, result.get("pizza").get(1).size());
      assertEquals(12, result.get("pizza").get(1).get("price").asInt());
    }

    @Test(expected = IOException.class)
    public void interpretMalformedData() throws IOException {
        interpreter.interpret("{\"this is\":\"no xml\"", Map.of());
    }

    @Test
    public void testSerialization() throws IOException {
        JsonNode expected = mapper.readTree("{\"type\":\"XML\",\"description\":\"Interpret data as XML data\",\"parameters\":[]}");
        JsonNode result = mapper.valueToTree(interpreter);

        assertEquals(expected, result);
    }

}
