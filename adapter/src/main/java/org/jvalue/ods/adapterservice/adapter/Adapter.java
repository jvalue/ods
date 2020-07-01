package org.jvalue.ods.adapterservice.adapter;

import com.fasterxml.jackson.databind.JsonNode;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.AdapterEvent;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.jvalue.ods.adapterservice.config.RabbitConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.io.IOException;
import java.util.Objects;

public class Adapter {
    private static final Logger logger = LoggerFactory.getLogger(Adapter.class);

    private Importer importer;

    private Interpreter interpreter;

    private DataBlobRepository blobRepository;

    private final RabbitTemplate rabbitTemplate;

    public Adapter(Importer importer, Interpreter interpreter, DataBlobRepository dataRepository, RabbitTemplate rabbitTemplate) {
        this.importer = importer;
        this.interpreter = interpreter;
        this.blobRepository = dataRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    public DataBlob.MetaData executeJob(AdapterConfig config){
        try {
            String raw = importer.fetch(config.protocolConfig.parameters);
            logger.debug("Fetched: {}", raw);
            JsonNode result = interpreter.interpret(raw, config.formatConfig.parameters);
            DataBlob blob = blobRepository.save(new DataBlob(result.toString()));

            // AdapterEvent adapterEvent = new AdapterEvent(blob.getData(), null); // FAT Event
            AdapterEvent adapterEvent = new AdapterEvent(config.getDataSourceId(), null, blob.getMetaData().getLocation());
            rabbitTemplate.convertAndSend(RabbitConfiguration.DATA_IMPORT_QUEUE, adapterEvent.toJSON());
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
