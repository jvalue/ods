package org.jvalue.ods.adapterservice.rest.v1;

import org.jvalue.ods.adapterservice.adapter.AdapterRepository;
import org.jvalue.ods.adapterservice.interpreter.Interpreter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
public class FormatEndpoint {

    private final AdapterRepository adapterRepository;

    @Autowired
    public FormatEndpoint(AdapterRepository adapterRepository) {
        this.adapterRepository = adapterRepository;
    }

    @GetMapping(Mappings.FORMAT_PATH)
    public Collection<Interpreter> getFormats() {
        return adapterRepository.getAllInterpreters();
    }
}
