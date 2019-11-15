package org.jvalue.ods.adapterservice.importer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Collections;
import java.util.Map;

public class HttpImporter extends Importer {

  private final Map<String, String> parameters =  Collections.unmodifiableMap(Map.of("location", "String of the URI for the HTTP call"));
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
  public Map<String, String> getAvailableParameters() {
    return parameters;
  }

  @Override
  protected String doFetch(Map<String, Object> parameters) {
    validateParameters(parameters);
    String location = parameters.get("location").toString();

    URI uri = URI.create(location);
    ResponseEntity<String> responseEntity = restTemplate.getForEntity(uri, String.class);
    return responseEntity.getBody();
  }
}
