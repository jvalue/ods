package org.jvalue.ods.adapterservice.datasource.api.amqp;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jvalue.ods.adapterservice.config.AdapterProperties;
import org.jvalue.ods.adapterservice.datasource.event.DatasourceConfigEvent;
import org.jvalue.ods.adapterservice.datasource.event.ImportFailedEvent;
import org.jvalue.ods.adapterservice.datasource.event.ImportSuccessEvent;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@AllArgsConstructor
public class AmqpPublisher {
  private final RabbitTemplate rabbitTemplate;
  private final AdapterProperties properties;

  public void publishCreation(Datasource datasource) {
    publish(properties.getAmqp().getDatasourceCreatedTopic(), new DatasourceConfigEvent(datasource));
  }

  public void publishUpdate(Datasource datasource) {
    publish(properties.getAmqp().getDatasourceUpdatedTopic(), new DatasourceConfigEvent(datasource));
  }

  public void publishDeletion(Datasource datasource) {
    publish(properties.getAmqp().getDatasourceDeletedTopic(), new DatasourceConfigEvent(datasource));
  }

  public void publishImportSuccess(Long id, String data) {
    publish(properties.getAmqp().getImportSuccessTopic(), new ImportSuccessEvent(id, data));
  }

  public void publishImportFailure(Long id, String errMsg) {
    publish(properties.getAmqp().getImportFailedTopic(), new ImportFailedEvent(id, errMsg));
  }

  private void publish(String topic, Object message) {
    for (int retries = properties.getAmqp().getPublishRetries(); retries >= 0; retries--) {
      try {
        this.rabbitTemplate.convertAndSend(properties.getAmqp().getExchange(), topic, message);
        return;
      } catch (AmqpException e) {
        try {
          Thread.sleep(properties.getAmqp().getPublishBackoff());
        } catch (InterruptedException interruptedException) {
          Thread.currentThread().interrupt();
          throw new RuntimeException(interruptedException);
        }
        log.warn("Message publish failed ({}). Retrying in {}", retries, properties.getAmqp().getPublishBackoff());
      }
    }
    log.error("Sending message {} to topic {} failed", message.toString(), topic);
  }

}
