package org.jvalue.ods.adapterservice.importer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

public class HttpImporter extends Importer {
    private final RestTemplate restTemplate = new RestTemplate();

    public String fetch(URI from) {
        ResponseEntity<String> responseEntity = restTemplate.getForEntity(from, String.class);
        return responseEntity.getBody();
    }

    @Override
    public String getType() {
        return "HTTP";
    }

    @Override
    public String getDescription() {
        return "Plain HTTP";
    }
}
