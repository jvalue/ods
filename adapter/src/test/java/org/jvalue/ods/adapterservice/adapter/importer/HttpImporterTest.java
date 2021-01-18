package org.jvalue.ods.adapterservice.adapter.importer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatcher;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URI;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class HttpImporterTest {
  @Mock
  RestTemplate restTemplate;

  private Importer importer;
  private final ObjectMapper mapper = new ObjectMapper();
  private final URI from = URI.create("http://www.the-inter.net/json");

  @BeforeEach
  public void setUp() {
    importer = new HttpImporter(restTemplate);
  }

  @Test
  public void testFetch() throws IOException {
    ResponseEntity<byte[]> response = new ResponseEntity<>("{\"content\":\"the internet as a string\"}".getBytes(), HttpStatus.OK);
    ArgumentMatcher<URI> uriMatcher = (URI uri) -> uri.getPath().equals(this.from.getPath());
    when(restTemplate.getForEntity(argThat(uriMatcher), eq(byte[].class))).thenReturn(response);

    String result = importer.fetch(Map.of("location", from.getPath(), "encoding", "UTF-8"));

    JsonNode resultNode = mapper.readTree(result);
    assertEquals(1, resultNode.size());
    assertEquals("the internet as a string", resultNode.get("content").textValue());
  }

  @Test
  public void testTypoInArguments() {
    assertThrows(IllegalArgumentException.class, () ->
      importer.fetch(Map.of("locationS", from.getPath(), "encodingS", "UTF-8"))
    );
  }

  @Test
  public void testFetchMissingURI() {
    assertThrows(IllegalArgumentException.class, () ->
      importer.fetch(Map.of())
    );
  }

  @Test
  public void testSerialization() throws IOException {
    JsonNode expected = mapper.readTree("""
      {
        "parameters":[
          {"name":"location", "description":"String of the URI for the HTTP call", "type":"java.lang.String", "required": true},
          {"name":"encoding", "description":"Encoding of the source. Available encodings: ISO-8859-1, US-ASCII, UTF-8", "type":"java.lang.String", "required": true},
          {"name":"defaultParameters", "description":"Default values for open parameters in the URI", "type":"org.jvalue.ods.adapterservice.datasource.model.RuntimeParameters", "required": false}
        ],
        "type":"HTTP",
        "description":"Plain HTTP"
      }""");
    JsonNode result = mapper.valueToTree(importer);

    assertEquals(expected, result);
  }

}
