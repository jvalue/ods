package org.jvalue.ods.adapterservice.rest.v1;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class VersionEndpoint {

    private static final String API_VERSION = "1.0";

    @GetMapping("/version")
    public String getApiVersion() {
        return API_VERSION;
    }
}
