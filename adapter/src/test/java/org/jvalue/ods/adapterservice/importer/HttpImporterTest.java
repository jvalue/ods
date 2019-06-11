package org.jvalue.ods.adapterservice.importer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.io.IOException;
import java.net.URI;

import static org.junit.Assert.assertEquals;

public class HttpImporterTest {
    private final Importer importer = new HttpImporter();
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    public void testFetch() throws IOException {
        URI randomQuote = URI.create("https://gturnquist-quoters.cfapps.io/api/random");
        String result = importer.fetch(randomQuote);

        JsonNode resultNode = mapper.readTree(result);
        assertEquals("success", resultNode.get("type").asText());
        assertEquals(2, resultNode.get("value").size());
    }
}
