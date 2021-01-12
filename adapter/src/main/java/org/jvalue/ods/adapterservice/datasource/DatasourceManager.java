package org.jvalue.ods.adapterservice.datasource;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataImportResponse;
import org.jvalue.ods.adapterservice.datasource.model.DataBlob;
import org.jvalue.ods.adapterservice.datasource.api.amqp.AmqpPublisher;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.DatasourceMetadata;
import org.jvalue.ods.adapterservice.datasource.model.RuntimeParameters;
import org.jvalue.ods.adapterservice.datasource.repository.DataBlobRepository;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Optional;
import java.util.stream.StreamSupport;

@Service
public class DatasourceManager {
  private static final Logger log = LoggerFactory.getLogger(DatasourceManager.class);

  private final DatasourceRepository datasourceRepository;
  private final DataBlobRepository dataBlobRepository;
  private final Adapter adapter;
  private final AmqpPublisher amqpPublisher;

  public DatasourceManager(
    DatasourceRepository datasourceRepository,
    DataBlobRepository dataBlobRepository,
    Adapter adapter,
    AmqpPublisher amqpPublisher) {
    this.datasourceRepository = datasourceRepository;
    this.dataBlobRepository = dataBlobRepository;
    this.adapter = adapter;
    this.amqpPublisher = amqpPublisher;
  }


  @Transactional
  public Datasource createDatasource(Datasource config) {
    config.getMetadata().setCreationTimestamp(new Date()); // creation time documented by server

    Datasource savedConfig = datasourceRepository.save(config);

    amqpPublisher.publishCreation(savedConfig);
    return savedConfig;
  }


  public Optional<Datasource> getDatasource(Long id) {
    return datasourceRepository.findById(id);
  }


  public Iterable<Datasource> getAllDatasources() {
    return datasourceRepository.findAll();
  }


  @Transactional
  public void updateDatasource(Long id, Datasource update) throws IllegalArgumentException {
    Datasource existing = datasourceRepository.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("Datasource with id " + id + " not found"));

    datasourceRepository.save(applyUpdate(existing, update));
    amqpPublisher.publishUpdate(existing);
  }


  @Transactional
  public void deleteDatasource(Long id) {
    Datasource datasource = datasourceRepository.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("Datasource with id " + id + " not found"));
    datasourceRepository.deleteById(id);
    amqpPublisher.publishDeletion(datasource);
  }


  @Transactional
  public void deleteAllDatasources() {
    Iterable<Datasource> allDatasourceConfigs = getAllDatasources();
    datasourceRepository.deleteAll();
    StreamSupport.stream(allDatasourceConfigs.spliterator(), true)
      .forEach(amqpPublisher::publishDeletion);
  }

  private AdapterConfig getParametrizedDatasource(Long id, RuntimeParameters runtimeParameters) {
    Datasource datasource = getDatasource(id)
      .orElseThrow(() -> new IllegalArgumentException("No datasource found with id " + id));
    return datasource.toAdapterConfig(runtimeParameters);
  }

  public DataBlob.MetaData trigger(Long id, RuntimeParameters runtimeParameters) {
    AdapterConfig adapterConfig = getParametrizedDatasource(id, runtimeParameters);
    try {
      DataImportResponse executionResult = adapter.executeJob(adapterConfig);
      DataBlob importedBlob = new DataBlob(executionResult.getData());

      DataBlob savedBlob = dataBlobRepository.save(importedBlob);

      amqpPublisher.publishImportSuccess(id, savedBlob.getData());
      return savedBlob.getMetaData();
    } catch (Exception e) {
      String errMsg;
      if (e.getCause() != null) {
        errMsg = e.getCause().getMessage();
      } else {
        errMsg = e.getMessage();
      }
      amqpPublisher.publishImportFailure(id, errMsg);
      if (e instanceof IllegalArgumentException) {
        log.error("Data Import request failed. Malformed Request: " + e.getMessage());
      } else {
        log.error("Exception in the Adapter: " + e.getMessage());
      }
      throw e;
    }
  }

  /**
   * Create an updated DatasourceConfig using the full representation of an update. This method ensures that id and
   * creation time remain stable.
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
