package org.jvalue.ods.adapterservice.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;

public class AdapterConfigTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    public void testAdapterSerialization() throws IOException {
        final String adapterJson = "{" +
                "\"protocol\":{" +
                  "\"type\":\"HTTP\"," +
                  "\"location\":\"URL\"" +
                "}," +
                "\"format\":{" +
                  "\"type\":\"JSON\"" +
                "}" +
              "}";
        AdapterConfig result = mapper.readValue(adapterJson, AdapterConfig.class);

        assertEquals("HTTP", result.protocolConfig.protocol);
        assertEquals("JSON", result.formatConfig.format);
        assertEquals("URL", result.protocolConfig.location);
    }
}
