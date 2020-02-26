package org.jvalue.ods.adapterservice.rest.v1;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.AdapterManager;
import org.jvalue.ods.adapterservice.model.AdapterConfig;
import org.jvalue.ods.adapterservice.model.MetaData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class AdapterEndpoint {

    private final AdapterManager adapterManager;

    @Autowired
    public AdapterEndpoint(AdapterManager adapterManager) {
        this.adapterManager = adapterManager;
    }

    @PostMapping("/dataImport")
    public MetaData executeDataImport(@RequestBody AdapterConfig config) {
        Adapter adapter = adapterManager.getAdapter(config);
        return adapter.executeJob(config);
    }
}
