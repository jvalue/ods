package org.jvalue.ods.adapterservice.importer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentMatcher;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URI;
import java.util.Map;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@RunWith(MockitoJUnitRunner.class)
public class HttpImporterTest {
    @Mock RestTemplate restTemplate;

    private Importer importer;
    private final ObjectMapper mapper = new ObjectMapper();
    private final URI from = URI.create("http://www.the-inter.net/json");

    @Before
    public void setUp() {
        ResponseEntity<String> response = new ResponseEntity<>("{\"content\":\"the internet as a string\"}", HttpStatus.OK);

        ArgumentMatcher<URI> uriMatcher = (URI uri) -> uri.getPath().equals(this.from.getPath());

        when(restTemplate.getForEntity(argThat(uriMatcher), eq(String.class))).thenReturn(response);
        importer = new HttpImporter(restTemplate);
    }

    @Test
    public void testFetch() throws IOException {
        String result = importer.fetch(Map.of("location", from.getPath()));

        JsonNode resultNode = mapper.readTree(result);
        assertEquals(1, resultNode.size());
        assertEquals("the internet as a string", resultNode.get("content").textValue());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testFetchMissingURI() throws IOException {
        importer.fetch(Map.of());
    }

    @Test
    public void testSerialization() throws IOException {
        JsonNode expected = mapper.readTree("{\"parameters\":{\"location\": \"String of the URI for the HTTP call\"}, \"type\":\"HTTP\",\"description\":\"Plain HTTP\"}");
        JsonNode result = mapper.valueToTree(importer);

        assertEquals(expected, result);
    }

}
