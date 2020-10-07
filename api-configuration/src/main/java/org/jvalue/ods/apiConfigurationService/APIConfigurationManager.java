package org.jvalue.ods.apiConfigurationService;

import org.jvalue.ods.apiConfigurationService.model.APIConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class APIConfigurationManager {

  private final APIConfigurationRepository configurationRepository;


  @Autowired
  public APIConfigurationManager(APIConfigurationRepository configurationRepository) {
    this.configurationRepository = configurationRepository;
  }

  @Transactional
  public APIConfiguration createAPIConfiguration(APIConfiguration config) {
    APIConfiguration savedConfig = configurationRepository.save(config);
    return savedConfig;
  }

  public Optional<APIConfiguration> getAPIConfiguration(Long id) {
    return configurationRepository.findById(id);
  }

  public Iterable<APIConfiguration> getAllAPIConfigurations() {
    return configurationRepository.findAll();
  }


  @Transactional
  public void updateAPIConfiguration(Long id, APIConfiguration updated) throws IllegalArgumentException {
    APIConfiguration old = configurationRepository.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("Datasource with id " + id + " not found."));

    configurationRepository.save(applyUpdate(old, updated));
  }

  @Transactional
  public void deleteAPIConfiguration(Long id) {
    configurationRepository.deleteById(id);
  }


  @Transactional
  public void deleteAllAPIConfigurations() {
    Iterable<APIConfiguration> allAPIConfigs = getAllAPIConfigurations();
    configurationRepository.deleteAll();
  }


  /**
   * Create an updated DatasourceConfig using the full representation of an update. This method ensures that id and creation time remain stable.
   *
   * @param updateConfig the representation of the updated config
   * @return an updated DatasourceConfig that has the same id and creationTimestamp as the original one.
   */
  private APIConfiguration applyUpdate(APIConfiguration existing, APIConfiguration updateConfig) {
    APIConfiguration updated = new APIConfiguration(
      existing.getId(),
      updateConfig.getPipelineId(),
      updateConfig.getDisplayName(),
      updateConfig.getDefaultAPI(),
      updateConfig.getRemoteSchemata()
    );

    return updated;
  }
}
