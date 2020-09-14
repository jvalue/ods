package org.jvalue.ods.adapterservice.adapter;

import com.fasterxml.jackson.databind.JsonNode;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Objects;

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

    public DataBlob executeJob(AdapterConfig config){
        try {
            String raw = importer.fetch(config.protocolConfig.parameters);
            logger.debug("Fetched: {}", raw);
            JsonNode result = interpreter.interpret(raw, config.formatConfig.parameters);
            DataBlob blob = blobRepository.save(new DataBlob(result.toString()));
            return blob;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Adapter adapter = (Adapter) o;
        return Objects.equals(importer, adapter.importer) &&
                Objects.equals(interpreter, adapter.interpreter) &&
                Objects.equals(blobRepository, adapter.blobRepository);
    }

    @Override
    public int hashCode() {
        return Objects.hash(importer, interpreter, blobRepository);
    }
}
