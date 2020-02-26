package org.jvalue.ods.adapterservice.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class DataBlobTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testSerialization() {
    String jsonString ="{\"whateverwillbe\":\"willbe\",\"quesera\":\"sera\"}";
    DataBlob blob = new DataBlob(jsonString);

    JsonNode result = mapper.valueToTree(blob);

    System.out.println(result.toString());
    assertEquals(1, result.size());
    assertEquals("null", result.get("id").asText());
  }

}
