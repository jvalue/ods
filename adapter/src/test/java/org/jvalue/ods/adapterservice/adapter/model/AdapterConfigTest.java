package org.jvalue.ods.adapterservice.adapter.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.jvalue.ods.adapterservice.adapter.Format;
import org.jvalue.ods.adapterservice.adapter.ProtocolEnum;

import java.io.IOException;

import static org.junit.Assert.assertEquals;

public class AdapterConfigTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testAdapterSerialization() throws IOException {
    final String adapterJson = "{" +
      "\"protocol\":{" +
        "\"type\":\"HTTP\"," +
        "\"parameters\":{" +
          "\"location\":\"URL\"" +
        "}" +
        "}," +
          "\"format\":{" +
          "\"type\":\"JSON\"," +
          "\"parameters\":{}" +
        "}" +
      "}";
    AdapterConfig result = mapper.readValue(adapterJson, AdapterConfig.class);

    assertEquals(ProtocolEnum.HTTP, result.protocolConfig.protocol);
    assertEquals(Format.JSON, result.formatConfig.format);
    assertEquals("URL", result.protocolConfig.parameters.get("location"));
  }
}
