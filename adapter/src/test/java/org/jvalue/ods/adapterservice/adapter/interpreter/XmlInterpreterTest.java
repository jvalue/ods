package org.jvalue.ods.adapterservice.adapter.interpreter;

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
        String result = interpreter.interpret(XML_STRING, Map.of());

        assertEquals("{\"to\":\"Walter Frosch\",\"body\":\"Nice game!\"}", result);
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

      String result = interpreter.interpret(collectionString, Map.of());

      assertEquals(
              "{\"pizza\":" +
                        "[{\"price\":\"2\",\"taste\":\"good\"}," +
                        "{\"price\":\"12\",\"taste\":\"disgusting\"}]}",
              result);
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

    String result = interpreter.interpret(collectionString, Map.of());

    assertEquals(
            "{\"menu\":" +
                        "{\"pizza\":[" +
                            "{\"price\":\"2\",\"taste\":\"good\"}," +
                            "{\"price\":\"12\",\"taste\":\"disgusting\"}]}}",
            result
    );
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

      String result = interpreter.interpret(collectionString, Map.of());

      assertEquals(
              "{\"pizza\":[{\"type\":\"funghi\",\"taste\":\"good\"},{\"price\":\"12\"}]}",
              result);
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
