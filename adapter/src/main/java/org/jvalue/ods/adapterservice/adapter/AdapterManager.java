package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.importer.HttpImporter;
import org.jvalue.ods.adapterservice.importer.Importer;
import org.jvalue.ods.adapterservice.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.interpreter.JsonInterpreter;
import org.jvalue.ods.adapterservice.interpreter.XmlInterpreter;
import org.jvalue.ods.adapterservice.model.AdapterConfig;

import java.util.Collection;

import java.util.Map;

import static java.util.Map.entry;

public class AdapterManager {

    private static final Map<String, Importer> importers = Map.ofEntries(
            entry("HTTP", new HttpImporter())
    );
    private static final Map<String, Interpreter> interpreters = Map.ofEntries(
            entry("JSON", new JsonInterpreter()),
            entry("XML", new XmlInterpreter())
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

    public static Collection<Importer> getAllImporters() {
        return importers.values();
    }

    public static Collection<Interpreter> getAllInterpreters() {
        return interpreters.values();
    }
}
