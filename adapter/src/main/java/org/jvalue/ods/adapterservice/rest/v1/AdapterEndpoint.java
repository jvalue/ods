package org.jvalue.ods.adapterservice.rest.v1;

import com.fasterxml.jackson.databind.JsonNode;
import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.AdapterManager;
import org.jvalue.ods.adapterservice.models.AdapterConfig;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class AdapterEndpoint {

    @PostMapping("/dataImport")
    public JsonNode executeDataImport(@RequestBody AdapterConfig config) {
        Adapter adapter = AdapterManager.getAdapter(config.importerType, config.interpreterType);
        return adapter.executeJob(config);
    }
}
