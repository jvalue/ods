package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.adapter.importer.HttpImporter;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.CsvInterpreter;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.interpreter.JsonInterpreter;
import org.jvalue.ods.adapterservice.adapter.interpreter.XmlInterpreter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collection;

import java.util.Map;

import static java.util.Map.entry;

@Service
public class AdapterFactory {

    private final DataBlobRepository dataRepository;

    private static final Map<String, Importer> importers = Map.ofEntries(
            entry("HTTP", new HttpImporter(new RestTemplate()))
    );
    private static final Map<String, Interpreter> interpreters = Map.ofEntries(
            entry("JSON", new JsonInterpreter()),
            entry("XML", new XmlInterpreter()),
            entry("CSV", new CsvInterpreter())
   );

    @Autowired
    public AdapterFactory(DataBlobRepository dataRepository) {
        this.dataRepository = dataRepository;
    }


    public Adapter getAdapter(AdapterConfig config) {
        Importer importer = importers.get(config.protocolConfig.protocol);
        if(importer == null) {
            throw new IllegalArgumentException("Importer for protocol " + config.protocolConfig.protocol + " does not exist");
        }
        Interpreter interpreter = interpreters.get(config.formatConfig.format);
        if(interpreter == null) {
            throw new IllegalArgumentException("Interpreter for format " + config.formatConfig.format + " does not exist");
        }

        return new Adapter(importer, interpreter, dataRepository);
    }

    public Collection<Importer> getAllImporters() {
        return importers.values();
    }

    public Collection<Interpreter> getAllInterpreters() {
        return interpreters.values();
    }
}
