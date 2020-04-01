package org.jvalue.ods.coreservice.repository;

import org.jvalue.ods.coreservice.model.PipelineConfig;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelineRepository extends CrudRepository<PipelineConfig, Long> {
  List<PipelineConfig> findPipelineConfigsByDatasourceId(Long datasourceId);
}
