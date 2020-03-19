package org.jvalue.ods.adapterservice.datasource;

import org.jvalue.ods.adapterservice.datasource.event.DatasourceEvent;
import org.jvalue.ods.adapterservice.datasource.event.EventType;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.DatasourceMetadata;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceRepository;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class DatasourceManager {

  private final DatasourceRepository datasourceRepository;
  private final DatasourceEventRepository eventRepository;


  @Autowired
  public DatasourceManager(DatasourceRepository datasourceRepository, DatasourceEventRepository eventRepository) {
    this.datasourceRepository = datasourceRepository;
    this.eventRepository = eventRepository;
  }


  @Transactional
  public Datasource createDatasource(Datasource config) {
    Datasource savedConfig = datasourceRepository.save(config);
    eventRepository.save(new DatasourceEvent(EventType.DATASOURCE_CREATE, savedConfig.getId()));
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
    eventRepository.save(new DatasourceEvent(EventType.DATASOURCE_UPDATE, id));
  }


  @Transactional
  public void deleteDatasource(Long id) {
    datasourceRepository.deleteById(id);
    eventRepository.save(new DatasourceEvent(EventType.DATASOURCE_DELETE, id));
  }


  @Transactional
  public void deleteAllDatasources() {
    Iterable<Datasource> allDatasourceConfigs = getAllDatasources();
    datasourceRepository.deleteAll();

    allDatasourceConfigs.forEach(
      pl -> eventRepository.save(new DatasourceEvent(EventType.DATASOURCE_DELETE, pl.getId()))
    );
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
      updateConfig.getMetadata(),
      updateConfig.getTrigger());
    updated.setId(existing.getId());

    return updated;
  }

  public Optional<DatasourceEvent> getEvent(Long id) {
    return eventRepository.findById(id);
  }

  public Iterable<DatasourceEvent> getEventsAfter(Long id) {
    return eventRepository.getAllByEventIdAfter(id);
  }

  public Iterable<DatasourceEvent> getEventsByDatasource(Long datasourceId, Long after) {
    return eventRepository.getAllByDatasourceIdAndEventIdAfter(datasourceId, after);
  }

  public DatasourceEvent getLatestEvent() {
    return eventRepository.findFirstByOrderByEventIdDesc();
  }
}
