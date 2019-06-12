package org.jvalue.ods.adapterservice.rest.v1;

import org.jvalue.ods.adapterservice.adapter.AdapterManager;
import org.jvalue.ods.adapterservice.importer.Importer;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
public class ProtocolEndpoint {

    @GetMapping("/protocols")
    public Collection<Importer> getProtocols() {
        return AdapterManager.getAllImporters();
    }
}
