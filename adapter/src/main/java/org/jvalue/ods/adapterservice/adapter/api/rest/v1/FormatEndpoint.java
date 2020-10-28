package org.jvalue.ods.adapterservice.adapter.api.rest.v1;

import org.jvalue.ods.adapterservice.adapter.AdapterFactory;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
public class FormatEndpoint {

    private final AdapterFactory adapterFactory;

    @Autowired
    public FormatEndpoint(AdapterFactory adapterFactory) {
        this.adapterFactory = adapterFactory;
    }

    @GetMapping(Mappings.FORMAT_PATH)
    public Collection<Interpreter> getFormats() {
        return adapterFactory.getAllInterpreters();
    }
}
