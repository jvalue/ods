package org.jvalue.ods.adapterservice.rest.v1;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.AdapterRepository;
import org.jvalue.ods.adapterservice.model.AdapterConfig;
import org.jvalue.ods.adapterservice.model.DataBlob;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/")
public class AdapterEndpoint {

    private final AdapterRepository adapterRepository;

    @Autowired
    public AdapterEndpoint(AdapterRepository adapterRepository) {
        this.adapterRepository = adapterRepository;
    }

    @PostMapping("/dataImport")
    public DataBlob.MetaData executeDataImport(@RequestBody AdapterConfig config) {
        Adapter adapter = adapterRepository.getAdapter(config);
        return adapter.executeJob(config);
    }
}
