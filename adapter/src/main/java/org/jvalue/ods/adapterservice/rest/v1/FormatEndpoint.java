package org.jvalue.ods.adapterservice.rest.v1;

import org.jvalue.ods.adapterservice.adapter.AdapterManager;
import org.jvalue.ods.adapterservice.interpreter.Interpreter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
public class FormatEndpoint {

    private final AdapterManager adapterManager;

    @Autowired
    public FormatEndpoint(AdapterManager adapterManager) {
        this.adapterManager = adapterManager;
    }

    @GetMapping("/formats")
    public Collection<Interpreter> getFormats() {
        return adapterManager.getAllInterpreters();
    }
}
