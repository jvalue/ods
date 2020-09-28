package org.jvalue.ods.apiConfigurationService;

import org.jvalue.ods.apiConfigurationService.model.APIConfiguration;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface APIConfigurationRepository extends CrudRepository<APIConfiguration, Long> {
}

