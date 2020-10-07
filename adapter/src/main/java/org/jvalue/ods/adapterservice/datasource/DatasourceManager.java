package org.jvalue.ods.adapterservice.datasource;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.AdapterFactory;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.jvalue.ods.adapterservice.datasource.api.amqp.AmqpHandler;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.DatasourceMetadata;
import org.jvalue.ods.adapterservice.datasource.model.RuntimeParameters;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Optional;

@Service
public class DatasourceManager {

  private final DatasourceRepository datasourceRepository;
  private final AdapterFactory adapterFactory;
  private final AmqpHandler amqpHandler;

  @Autowired
  public DatasourceManager(DatasourceRepository datasourceRepository, AdapterFactory adapterFactory, AmqpHandler amqpHandler) {
    this.datasourceRepository = datasourceRepository;
    this.adapterFactory = adapterFactory;
    this.amqpHandler = amqpHandler;
  }


  @Transactional
  public Datasource createDatasource(Datasource config) {
    config.getMetadata().setCreationTimestamp(new Date()); // creation time documented by server

    Datasource savedConfig = datasourceRepository.save(config);

    amqpHandler.publishCreation(savedConfig);
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
      .orElseThrow(() -> new IllegalArgumentException("Datasource with id " + id + " not found."));

    datasourceRepository.save(applyUpdate(existing, update));
    amqpHandler.publishUpdate(existing);
  }


  @Transactional
  public void deleteDatasource(Long id) {
    datasourceRepository.deleteById(id);
    amqpHandler.publishDeletion(id);
  }


  @Transactional
  public void deleteAllDatasources() {
    Iterable<Datasource> allDatasourceConfigs = getAllDatasources();
    datasourceRepository.deleteAll();
    for (Datasource ds: allDatasourceConfigs) {
        amqpHandler.publishDeletion(ds.getId());
    }
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
      amqpHandler.publishImportSuccess(id, executionResult.getData());
      return executionResult.getMetaData();
   } catch (Exception e) {
      amqpHandler.publishImportFailure(id, e.getMessage());
     if(e instanceof IllegalArgumentException) {
       System.err.println("Data Import request failed. Malformed Request: " + e.getMessage());
     } else {
       System.err.println("Exception in the Adapter: " + e.getMessage());
     }
       throw e;
   }
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
