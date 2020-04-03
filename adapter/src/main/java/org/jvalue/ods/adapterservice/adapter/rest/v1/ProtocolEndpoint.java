package org.jvalue.ods.adapterservice.adapter.rest.v1;

import org.jvalue.ods.adapterservice.adapter.AdapterFactory;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
public class ProtocolEndpoint {

    private final AdapterFactory adapterFactory;

    @Autowired
    public ProtocolEndpoint(AdapterFactory adapterFactory) {
        this.adapterFactory = adapterFactory;
    }

    @GetMapping("/protocols")
    public Collection<Importer> getProtocols() {
        return adapterFactory.getAllImporters();
    }
}
