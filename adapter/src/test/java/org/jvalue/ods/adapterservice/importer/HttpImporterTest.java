package org.jvalue.ods.adapterservice.importer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URI;

import static org.junit.Assert.*;
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
        when(restTemplate.getForEntity(from, String.class)).thenReturn(response);
        importer = new HttpImporter(restTemplate);
    }

    @Test
    public void testFetch() throws IOException {
        String result = importer.fetch(from);

        JsonNode resultNode = mapper.readTree(result);
        assertEquals(1, resultNode.size());
        assertEquals("the internet as a string", resultNode.get("content").textValue());
    }

    @Test
    public void testSerialization() throws IOException {
        JsonNode expected = mapper.readTree("{\"parameters\":{},\"type\":\"HTTP\",\"description\":\"Plain HTTP\"}");
        JsonNode result = mapper.valueToTree(importer);

        assertEquals(expected, result);
    }

}
