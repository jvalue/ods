package org.jvalue.ods.adapterservice.adapter.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.jvalue.ods.adapterservice.adapter.Format;
import org.jvalue.ods.adapterservice.adapter.Protocol;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class AdapterConfigTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testAdapterSerialization() throws IOException {
    final String adapterJson = """
      {
        "protocol": {
          "type": "HTTP",
          "parameters": {
            "location": "URL"
          }
        },
        "format": {
          "type": "JSON",
          "parameters": {}
        }
      }
      """;
    AdapterConfig result = mapper.readValue(adapterJson, AdapterConfig.class);

    assertEquals(Protocol.HTTP, result.protocolConfig.protocol);
    assertEquals(Format.JSON, result.formatConfig.format);
    assertEquals("URL", result.protocolConfig.parameters.get("location"));
  }
}
