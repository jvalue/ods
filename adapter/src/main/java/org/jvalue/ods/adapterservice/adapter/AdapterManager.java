package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.importer.HttpDataImporter;
import org.jvalue.ods.adapterservice.importer.Importer;
import org.jvalue.ods.adapterservice.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.interpreter.JsonInterpreter;

import java.util.Collections;
import java.util.Map;

public class AdapterManager {

    private static final Map<String, Importer> importers = Collections.singletonMap(
            "HTTP", new HttpDataImporter()
    );
    private static final Map<String, Interpreter> interpreters = Collections.singletonMap(
            "JSON", new JsonInterpreter()
    );

    public static Adapter getAdapter(String importerClass, String interpreterClass) {
        Importer importer = importers.get(importerClass);
        if(importer == null) {
            throw new IllegalArgumentException("Importer " + importerClass + " does not exist");
        }
        Interpreter interpreter = interpreters.get(interpreterClass);
        if(interpreter == null) {
            throw new IllegalArgumentException("Interpreter " + interpreterClass + " does not exist");
        }

        return new Adapter(importer, interpreter);
    }
}
