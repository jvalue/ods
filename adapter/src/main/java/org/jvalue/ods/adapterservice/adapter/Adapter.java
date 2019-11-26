package org.jvalue.ods.adapterservice.adapter;

import com.fasterxml.jackson.databind.JsonNode;
import org.jvalue.ods.adapterservice.importer.Importer;
import org.jvalue.ods.adapterservice.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.model.AdapterConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

public class Adapter {
    private static final Logger logger = LoggerFactory.getLogger(Adapter.class);

    private final Importer importer;

    private final Interpreter interpreter;

    public Adapter(Importer importer, Interpreter interpreter) {
        this.importer = importer;
        this.interpreter = interpreter;
    }


    public JsonNode executeJob(AdapterConfig config){
        try {
            String raw = importer.fetch(config.protocolConfig.parameters);
            logger.debug("Fetched: {}", raw);
            return interpreter.interpret(raw, config.formatConfig.parameters);
        } catch (IOException e) {
            throw new IllegalArgumentException("Not able to parse data as format: " + config.formatConfig.format, e);
        }
    }

    public String protocol() {
        return importer.getType();
    }

    public String format() {
        return interpreter.getType();
    }
}
