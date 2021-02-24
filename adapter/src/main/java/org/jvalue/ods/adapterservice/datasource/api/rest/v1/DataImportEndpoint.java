package org.jvalue.ods.adapterservice.datasource.api.rest.v1;

import java.util.Collection;
import java.util.stream.Collectors;

import org.jvalue.ods.adapterservice.datasource.DatasourceManager;
import org.jvalue.ods.adapterservice.datasource.model.DataImport;
import org.jvalue.ods.adapterservice.datasource.model.exceptions.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
@RequestMapping(Mappings.DATASOURCE_PATH)
public class DataImportEndpoint {
  private final DatasourceManager datasourceManager;

  @GetMapping("/{datasourceId}" + Mappings.DATAIMPORT_PATH)
  @Transactional
  public Iterable<DataImport.MetaData> getDataImports(@PathVariable Long datasourceId)
      throws DatasourceNotFoundException {
    Collection<DataImport> dataImports = datasourceManager.getDataImportsForDatasource(datasourceId);
    Collection<DataImport.MetaData> metadatas = dataImports.stream()
        .map((DataImport dataImport) -> dataImport.getMetaData()).collect(Collectors.toList());
    return metadatas;
  }

  @GetMapping("/{datasourceId}" + Mappings.DATAIMPORT_PATH + Mappings.LATEST_PATH)
  @Transactional
  public DataImport.MetaData getLatestDataImport(@PathVariable Long datasourceId)
      throws DatasourceNotFoundException, DataImportLatestNotFoundException {
    DataImport latestDataImport = datasourceManager.getLatestDataImportForDatasource(datasourceId);
    return latestDataImport.getMetaData();
  }

  @GetMapping("/{datasourceId}" + Mappings.DATAIMPORT_PATH + Mappings.LATEST_PATH + Mappings.DATA_PATH)
  @Transactional
  public String getLatestDataImportData(@PathVariable Long datasourceId)
      throws DatasourceNotFoundException, DataImportLatestNotFoundException {
    DataImport latestDataImport = datasourceManager.getLatestDataImportForDatasource(datasourceId);
    return latestDataImport.getData();
  }

  @GetMapping("/{datasourceId}" + Mappings.DATAIMPORT_PATH + "/{dataImportId}")
  @Transactional
  public DataImport.MetaData getDataImport(@PathVariable Long datasourceId, @PathVariable Long dataImportId)
      throws DatasourceNotFoundException, DataImportNotFoundException {
    DataImport dataImport = datasourceManager.getDataImportForDatasource(datasourceId, dataImportId);
    return dataImport.getMetaData();
  }

  @GetMapping(value = "/{datasourceId}" + Mappings.DATAIMPORT_PATH + "/{dataImportId}" + Mappings.DATA_PATH, produces = "application/json")
  @Transactional 
  public String getData(@PathVariable Long datasourceId, @PathVariable Long dataImportId)
      throws DatasourceNotFoundException, DataImportNotFoundException {
    DataImport dataImport = datasourceManager.getDataImportForDatasource(datasourceId, dataImportId);
    return dataImport.getData();
  }
}
