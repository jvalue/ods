package org.jvalue.ods.adapterservice.rest.v1;

import org.jvalue.ods.adapterservice.adapter.AdapterManager;
import org.jvalue.ods.adapterservice.interpreter.Interpreter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
public class FormatEndpoint {

    @GetMapping("/formats")
    public Collection<Interpreter> getFormats() {
        return AdapterManager.getAllInterpreters();
    }
}
