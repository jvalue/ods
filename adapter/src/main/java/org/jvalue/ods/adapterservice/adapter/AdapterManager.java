package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.importer.HttpImporter;
import org.jvalue.ods.adapterservice.importer.Importer;
import org.jvalue.ods.adapterservice.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.interpreter.JsonInterpreter;
import org.jvalue.ods.adapterservice.model.AdapterConfig;

import java.util.Collections;
import java.util.Map;

public class AdapterManager {

    private static final Map<String, Importer> importers = Collections.singletonMap(
            "HTTP", new HttpImporter()
    );
    private static final Map<String, Interpreter> interpreters = Collections.singletonMap(
            "JSON", new JsonInterpreter()
    );

    public static Adapter getAdapter(AdapterConfig config) {
        Importer importer = importers.get(config.protocol);
        if(importer == null) {
            throw new IllegalArgumentException("Importer for protocol " + config.protocol + " does not exist");
        }
        Interpreter interpreter = interpreters.get(config.format);
        if(interpreter == null) {
            throw new IllegalArgumentException("Interpreter for format " + config.format + " does not exist");
        }

        return new Adapter(importer, interpreter);
    }
}
