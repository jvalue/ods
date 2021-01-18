package org.jvalue.ods.adapterservice.adapter.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.jvalue.ods.adapterservice.datasource.model.DataBlob;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class DataBlobTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testSerialization() {
    String jsonString = "{\"whateverwillbe\":\"willbe\",\"quesera\":\"sera\"}";
    DataBlob blob = new DataBlob(jsonString);

    JsonNode result = mapper.valueToTree(blob);

    System.out.println(result.toString());
    assertEquals(2, result.size());
    assertEquals("null", result.get("id").asText());
    assertEquals("{\"whateverwillbe\":\"willbe\",\"quesera\":\"sera\"}", result.get("data").asText());
  }

  @Test
  public void testMetaDataSerialization() {
    String jsonString = "{\"whateverwillbe\":\"willbe\",\"quesera\":\"sera\"}";
    DataBlob blob = new DataBlob(jsonString);

    JsonNode result = mapper.valueToTree(blob.getMetaData());

    System.out.println(result.toString());
    assertEquals(2, result.size());
    assertEquals("null", result.get("id").asText());
    assertEquals("/data/null", result.get("location").asText());
  }
}
