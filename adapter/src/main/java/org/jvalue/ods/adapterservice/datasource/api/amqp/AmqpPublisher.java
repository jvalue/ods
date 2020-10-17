package org.jvalue.ods.adapterservice.datasource.api.amqp;

import org.jvalue.ods.adapterservice.config.RabbitConfiguration;
import org.jvalue.ods.adapterservice.datasource.event.*;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.Serializable;

@Service
public class AmqpPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Autowired
    public AmqpPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishCreation(Datasource datasource) {
        publish(RabbitConfiguration.AMQP_DATASOURCE_CREATED_TOPIC, new DatasourceCreationEvent(datasource));
    }

    public void publishUpdate(Datasource datasource) {
        publish(RabbitConfiguration.AMQP_DATASOURCE_UPDATED_TOPIC, new DatasourceUpdateEvent(datasource));
    }

    public void publishDeletion(Long datasourceId) {
        publish(RabbitConfiguration.AMQP_DATASOURCE_DELETED_TOPIC, new DatasourceConfigEvent(datasourceId));
    }

    public void publishImportSuccess(Long id, String data) {
        publish(RabbitConfiguration.AMQP_IMPORT_SUCCESS_TOPIC, new DatasourceImportedEvent(id, data));
    }

    public void publishImportFailure(Long id, String errMsg) {
        publish(RabbitConfiguration.AMQP_IMPORT_FAILED_TOPIC, new ImportFailedEvent(id, errMsg));
    }

    private void publish(String topic, Serializable message) {
        for (int retries = RabbitConfiguration.AMQP_PUBLISH_RETRIES; retries >= 0; retries--) {
            try {
                this.rabbitTemplate.convertAndSend(RabbitConfiguration.AMPQ_EXCHANGE, topic, message);
                return;
            } catch (AmqpException e) {
                try {
                    Thread.sleep(RabbitConfiguration.AMQP_PUBLISH_BACKOFF);
                } catch (InterruptedException interruptedException) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(interruptedException);
                }
                System.err.println("Message publish failed ("+retries+"). Retrying in "+RabbitConfiguration.AMQP_PUBLISH_BACKOFF);
            }
        }
        System.err.println("Sending message "+ message.toString() + " to topic: " + topic + " failed.");
    }

}
