package org.jvalue.ods.adapterservice.importer;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

public class HttpImporter extends Importer {
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public Object fetch(URI from) {
        ResponseEntity<Object> responseEntity = restTemplate.getForEntity(from, Object.class);
        return responseEntity.getBody();
    }

    @Override
    public String type() {
        return "HTTP";
    }
}
