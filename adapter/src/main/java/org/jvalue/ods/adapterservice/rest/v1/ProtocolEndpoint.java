package org.jvalue.ods.adapterservice.rest.v1;

import org.jvalue.ods.adapterservice.adapter.AdapterRepository;
import org.jvalue.ods.adapterservice.importer.Importer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
public class ProtocolEndpoint {

    private final AdapterRepository adapterRepository;

    @Autowired
    public ProtocolEndpoint(AdapterRepository adapterRepository) {
        this.adapterRepository = adapterRepository;
    }

    @GetMapping(Mappings.PROTOCOL_PATH)
    public Collection<Importer> getProtocols() {
        return adapterRepository.getAllImporters();
    }
}
