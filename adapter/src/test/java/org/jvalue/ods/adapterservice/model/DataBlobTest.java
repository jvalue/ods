package org.jvalue.ods.adapterservice.model;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class DataBlobTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testSerialization() throws JsonProcessingException {
    JsonNode jsonNode = mapper.readTree("{ \"whateverwillbe\": \"willbe\", \"quesera\": \"sera\" }");
    DataBlob blob = new DataBlob(jsonNode);

    JsonNode result = mapper.valueToTree(blob);

    System.out.println(result.toString());
    assertEquals("{\"id\":null,\"data\":{\"whateverwillbe\":\"willbe\",\"quesera\":\"sera\"}}", result.toString());
  }

}
