package org.jvalue.ods.adapterservice.adapter;

import com.fasterxml.jackson.databind.JsonNode;
import org.jvalue.ods.adapterservice.importer.Importer;
import org.jvalue.ods.adapterservice.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.model.AdapterConfig;

import java.net.URI;

public class Adapter {
    private final Importer importer;
    private final Interpreter interpreter;

    public Adapter(Importer importer, Interpreter interpreter) {
        this.importer = importer;
        this.interpreter = interpreter;
    }

    public JsonNode executeJob(AdapterConfig config) {
        return interpreter.interpret(importer.fetch(URI.create(config.location)));
    }

    public String protocol() {
        return importer.type();
    }

    public String format() {
        return interpreter.type();
    }
}
