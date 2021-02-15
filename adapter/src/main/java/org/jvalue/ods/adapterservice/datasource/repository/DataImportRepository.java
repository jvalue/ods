package org.jvalue.ods.adapterservice.datasource.repository;

import java.util.Optional;

import org.jvalue.ods.adapterservice.datasource.model.DataImport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DataImportRepository extends JpaRepository<DataImport, Long> {
  /**
   * Finds the latest DataImport by datasource id.
   * Simply using the correct keywords in the function name makes this work using spring magic.
   */
  Optional<DataImport> findTopByDatasourceIdOrderByTimestampDesc(Long datasourceId);
  Optional<DataImport> findByDatasourceIdAndId(Long datasourceId, Long id);
}
