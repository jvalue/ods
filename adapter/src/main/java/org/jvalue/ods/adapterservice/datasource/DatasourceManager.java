package org.jvalue.ods.adapterservice.datasource;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.AdapterFactory;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.jvalue.ods.adapterservice.config.RabbitConfiguration;
import org.jvalue.ods.adapterservice.datasource.event.DatasourceImportedEvent;
import org.jvalue.ods.adapterservice.datasource.event.ImportFailedEvent;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.DatasourceMetadata;
import org.jvalue.ods.adapterservice.datasource.model.RuntimeParameters;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceRepository;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.Serializable;
import java.util.Date;
import java.util.Optional;

@Service
public class DatasourceManager {

  private final DatasourceRepository datasourceRepository;
  private final AdapterFactory adapterFactory;
  private final RabbitTemplate rabbitTemplate;


  @Autowired
  public DatasourceManager(DatasourceRepository datasourceRepository, AdapterFactory adapterFactory, RabbitTemplate rabbitTemplate) {
    this.datasourceRepository = datasourceRepository;
    this.adapterFactory = adapterFactory;
    this.rabbitTemplate = rabbitTemplate;
  }


  @Transactional
  public Datasource createDatasource(Datasource config) {
    config.getMetadata().setCreationTimestamp(new Date()); // creation time documented by server

    Datasource savedConfig = datasourceRepository.save(config);

    return savedConfig;
  }


  public Optional<Datasource> getDatasource(Long id) {
    return datasourceRepository.findById(id);
  }


  public Iterable<Datasource> getAllDatasources() {
    return datasourceRepository.findAll();
  }


  @Transactional
  public void updateDatasource(Long id, Datasource updated) throws IllegalArgumentException {
    Datasource old = datasourceRepository.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("Datasource with id " + id + " not found."));

    datasourceRepository.save(applyUpdate(old, updated));
  }


  @Transactional
  public void deleteDatasource(Long id) {
    datasourceRepository.deleteById(id);
  }


  @Transactional
  public void deleteAllDatasources() {
    Iterable<Datasource> allDatasourceConfigs = getAllDatasources();
    datasourceRepository.deleteAll();
  }

 private AdapterConfig getParametrizedDatasource(Long id, RuntimeParameters runtimeParameters) {
   Datasource datasource = getDatasource(id)
     .orElseThrow(() -> new IllegalArgumentException("No datasource found with id " + id));
   return datasource.toAdapterConfig(runtimeParameters);
 }

 public DataBlob.MetaData trigger(Long id, RuntimeParameters runtimeParameters) {
    AdapterConfig adapterConfig = getParametrizedDatasource(id, runtimeParameters);
   try {
      Adapter adapter = adapterFactory.getAdapter(adapterConfig);
      DataBlob executionResult = adapter.executeJob(adapterConfig);
      DatasourceImportedEvent importedEvent = new DatasourceImportedEvent(id, executionResult.getData());
      publishAmqp(RabbitConfiguration.AMQP_IMPORT_SUCCESS_TOPIC, importedEvent);
      return executionResult.getMetaData();
   } catch (Exception e) {
      ImportFailedEvent failedEvent = new ImportFailedEvent(id, e.getMessage());
      publishAmqp(RabbitConfiguration.AMQP_IMPORT_FAILED_TOPIC, failedEvent);
     if(e instanceof IllegalArgumentException) {
       System.err.println("Data Import request failed. Malformed Request: " + e.getMessage());
       throw e;
     } else {
       System.err.println("Exception in the Adapter: " + e.getMessage());
       throw e;
     }
   }
 }

 private void publishAmqp(String topic, Serializable message) {
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
              System.out.println("Message publish failed ("+retries+"). Retrying in "+RabbitConfiguration.AMQP_PUBLISH_BACKOFF);
          }
      }
      System.err.println("Sending message "+ message.toString() + " to topic: " + topic + " failed.");
 }

  /**
   * Create an updated DatasourceConfig using the full representation of an update. This method ensures that id and creation time remain stable.
   *
   * @param updateConfig the representation of the updated config
   * @return an updated DatasourceConfig that has the same id and creationTimestamp as the original one.
   */
  private Datasource applyUpdate(Datasource existing, Datasource updateConfig) {
    DatasourceMetadata updatedMetadata = new DatasourceMetadata(
      updateConfig.getMetadata().getAuthor(),
      updateConfig.getMetadata().getLicense(),
      updateConfig.getMetadata().getDisplayName(),
      updateConfig.getMetadata().getDescription());
    updatedMetadata.setCreationTimestamp(existing.getMetadata().getCreationTimestamp());

    Datasource updated = new Datasource(
      updateConfig.getProtocol(),
      updateConfig.getFormat(),
      updatedMetadata,
      updateConfig.getTrigger());
    updated.setId(existing.getId());

    return updated;
  }
}
