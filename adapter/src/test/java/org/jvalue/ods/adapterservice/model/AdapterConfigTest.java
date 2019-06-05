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
                "\"protocol\":\"HTTP\"," +
                "\"format\":\"JSON\"," +
                "\"location\":\"URL\"}";
        AdapterConfig result = mapper.readValue(adapterJson, AdapterConfig.class);

        assertEquals("HTTP", result.protocol);
        assertEquals("JSON", result.format);
        assertEquals("URL", result.location);
    }
}
