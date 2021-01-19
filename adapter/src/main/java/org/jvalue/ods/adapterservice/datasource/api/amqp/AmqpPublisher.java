package org.jvalue.ods.adapterservice.datasource.api.amqp;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jvalue.ods.adapterservice.config.AdapterProperties;
import org.jvalue.ods.adapterservice.datasource.event.DatasourceConfigEvent;
import org.jvalue.ods.adapterservice.datasource.event.ImportFailedEvent;
import org.jvalue.ods.adapterservice.datasource.event.ImportSuccessEvent;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.OutboxEvent;
import org.jvalue.ods.adapterservice.datasource.repository.OutboxEventRepository;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@AllArgsConstructor
public class AmqpPublisher {
  private final AdapterProperties properties;
  private final OutboxEventRepository outboxEventRepository;

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
    var event = new OutboxEvent(topic, message);
    outboxEventRepository.save(event);
  }
}
