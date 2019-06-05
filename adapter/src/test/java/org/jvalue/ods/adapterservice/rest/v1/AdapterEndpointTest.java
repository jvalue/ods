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

        JsonNode resultNode = mapper.valueToTree(result);
        assertEquals("success", resultNode.get("type").asText());
        assertEquals(2, resultNode.get("value").size());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testExecuteDataImportFTPJSON() {
        final AdapterConfig config = new AdapterConfig("FTP", "JSON", "https://gturnquist-quoters.cfapps.io/api/random");
        JsonNode result = endpoint.executeDataImport(config);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testExecuteDataImportHTTPXML() {
        final AdapterConfig config = new AdapterConfig("HTTP", "XML", "https://gturnquist-quoters.cfapps.io/api/random");
        JsonNode result = endpoint.executeDataImport(config);
    }
}
