package org.jvalue.ods.adapterservice.adapter;

import com.fasterxml.jackson.databind.JsonNode;
import org.jvalue.ods.adapterservice.importer.Importer;
import org.jvalue.ods.adapterservice.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.model.AdapterConfig;
import org.jvalue.ods.adapterservice.model.DataBlob;
import org.jvalue.ods.adapterservice.model.MetaData;
import org.jvalue.ods.adapterservice.repository.DataBlobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

public class Adapter {
    private static final Logger logger = LoggerFactory.getLogger(Adapter.class);

    private Importer importer;

    private Interpreter interpreter;

    private DataBlobRepository blobRepository;

    public Adapter(Importer importer, Interpreter interpreter, DataBlobRepository dataRepository) {
        this.importer = importer;
        this.interpreter = interpreter;
        this.blobRepository = dataRepository;
    }

    public MetaData executeJob(AdapterConfig config){
        try {
            String raw = importer.fetch(config.protocolConfig.parameters);
            logger.debug("Fetched: {}", raw);
            JsonNode result = interpreter.interpret(raw, config.formatConfig.parameters);
            DataBlob blob = blobRepository.save(new DataBlob(result.asText()));
            return blob.getMetaData();
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
