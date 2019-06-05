package org.jvalue.ods.adapterservice.importer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.net.URI;

import static org.junit.Assert.assertEquals;

public class HttpImporterTest {
    private final Importer importer = new HttpImporter();
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    public void testFetch() {
        URI randomQuote = URI.create("https://gturnquist-quoters.cfapps.io/api/random");
        Object result = importer.fetch(randomQuote);

        JsonNode resultNode = mapper.valueToTree(result);
        assertEquals("success", resultNode.get("type").asText());
        assertEquals(2, resultNode.get("value").size());
    }
}
