package org.jvalue.ods.adapterservice.importer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Map;

public class HttpImporter extends Importer {

  public final Map<String, String> parameters = Map.of("location", "String of the URL for the HTTP call");

  private final RestTemplate restTemplate;

  public HttpImporter(RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
  }

  @Override
  public String getType() {
    return "HTTP";
  }

  @Override
  public String getDescription() {
    return "Plain HTTP";
  }

  @Override
  public String fetch(Map<String, Object> parameters) {
    validateParameters(parameters);
    String location = parameters.get("location").toString();

    URI uri = URI.create(location);
    ResponseEntity<String> responseEntity = restTemplate.getForEntity(uri, String.class);
    return responseEntity.getBody();
  }

  private void validateParameters(Map<String, Object> parameters) {
    if(parameters.get("location") == null) {
      throw new IllegalArgumentException("HTTP importer requires parameter location");
    }
  }
}
