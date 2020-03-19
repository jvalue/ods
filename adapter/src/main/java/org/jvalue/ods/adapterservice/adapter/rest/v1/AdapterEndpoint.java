package org.jvalue.ods.adapterservice.adapter.rest.v1;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.AdapterFactory;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class AdapterEndpoint {

    private final AdapterFactory adapterFactory;

    @Autowired
    public AdapterEndpoint(AdapterFactory adapterFactory) {
        this.adapterFactory = adapterFactory;
    }

    @PostMapping("/dataImport")
    public DataBlob.MetaData executeDataImport(@RequestBody AdapterConfig config) {
        Adapter adapter = adapterFactory.getAdapter(config);
        return adapter.executeJob(config);
    }
}
