package org.jvalue.ods.adapterservice.datasource.api.amqp;

import org.jvalue.ods.adapterservice.config.AdapterProperties;
import org.jvalue.ods.adapterservice.datasource.event.DatasourceConfigEvent;
import org.jvalue.ods.adapterservice.datasource.event.ImportSuccessEvent;
import org.jvalue.ods.adapterservice.datasource.event.ImportFailedEvent;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class AmqpPublisher {
  private static final Logger logger = LoggerFactory.getLogger(AmqpPublisher.class);

  private final RabbitTemplate rabbitTemplate;
  private final AdapterProperties.Amqp amqpConfig;

  public AmqpPublisher(RabbitTemplate rabbitTemplate, AdapterProperties adapterProperties) {
    this.rabbitTemplate = rabbitTemplate;
    this.amqpConfig = adapterProperties.getAmqp();
  }

  public void publishCreation(Datasource datasource) {
    publish(amqpConfig.getDatasourceCreatedTopic(), new DatasourceConfigEvent(datasource));
  }

  public void publishUpdate(Datasource datasource) {
    publish(amqpConfig.getDatasourceUpdatedTopic(), new DatasourceConfigEvent(datasource));
  }

  public void publishDeletion(Datasource datasource) {
    publish(amqpConfig.getDatasourceDeletedTopic(), new DatasourceConfigEvent(datasource));
  }

  public void publishImportSuccess(Long id, String data) {
    publish(amqpConfig.getImportSuccessTopic(), new ImportSuccessEvent(id, data));
  }

  public void publishImportFailure(Long id, String errMsg) {
    publish(amqpConfig.getImportFailedTopic(), new ImportFailedEvent(id, errMsg));
  }

  private void publish(String topic, Object message) {
    for (int retries = amqpConfig.getPublishRetries(); retries >= 0; retries--) {
      try {
        this.rabbitTemplate.convertAndSend(amqpConfig.getExchange(), topic, message);
        return;
      } catch (AmqpException e) {
        try {
          Thread.sleep(amqpConfig.getPublishBackoff());
        } catch (InterruptedException interruptedException) {
          Thread.currentThread().interrupt();
          throw new RuntimeException(interruptedException);
        }
        logger.warn("Message publish failed (" + retries + "). Retrying in " + amqpConfig.getPublishBackoff());
      }
    }
    logger.error("Sending message " + message.toString() + " to topic: " + topic + " failed.");
  }

}
