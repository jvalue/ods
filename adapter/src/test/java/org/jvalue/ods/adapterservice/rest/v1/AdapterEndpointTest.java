package org.jvalue.ods.adapterservice.rest.v1;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.jvalue.ods.adapterservice.model.AdapterConfig;

import static org.junit.Assert.assertEquals;


public class AdapterEndpointTest {
    private static final ObjectMapper mapper = new ObjectMapper();
    private final AdapterEndpoint endpoint = new AdapterEndpoint();

    @Test
    public void testExecuteDataImportHTTPJSON() {
        final AdapterConfig config = new AdapterConfig("HTTP", "JSON", "https://gturnquist-quoters.cfapps.io/api/random");
        JsonNode result = endpoint.executeDataImport(config);

        assertEquals("success", result.get("type").asText());
        assertEquals(2, result.get("value").size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testExecuteDataImportFTPJSON() {
        final AdapterConfig config = new AdapterConfig("FTP", "JSON", "https://gturnquist-quoters.cfapps.io/api/random");
        endpoint.executeDataImport(config);
    }

    @Test()
    public void testExecuteDataImportHTTPXML() {
        final AdapterConfig config = new AdapterConfig("HTTP", "XML", "http://www.mocky.io/v2/5cf4f8352f000081724f05bf");
        JsonNode result = endpoint.executeDataImport(config);

        assertEquals("{\"to\":\"Tove\",\"from\":\"Jani\",\"heading\":\"Reminder\",\"body\":\"Don't forget me this weekend!\"}", result.toString());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testExecuteMalformedDataImport() {
        final AdapterConfig config = new AdapterConfig("HTTP", "JSON", "http://www.mocky.io/v2/5cf4f8352f000081724f05bf");
        endpoint.executeDataImport(config);
    }
}
