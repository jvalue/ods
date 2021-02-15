package org.jvalue.ods.adapterservice.datasource.api.rest.v1;

import java.util.Collection;
import java.util.stream.Collectors;

import org.jvalue.ods.adapterservice.datasource.DatasourceManager;
import org.jvalue.ods.adapterservice.datasource.model.DataImport;
import org.jvalue.ods.adapterservice.util.CheckedSupplier;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
@RequestMapping(Mappings.DATASOURCE_PATH)
public class DataImportEndpoint {
  private final DatasourceManager datasourceManager;

  private <T> T handleErrors(CheckedSupplier<T> function) throws ResponseStatusException {
    try {
      return function.get();
    } catch (Exception e) {
      HttpStatus errorCode = Mappings.ERROR_MAPPING.getOrDefault(e.getClass(), HttpStatus.INTERNAL_SERVER_ERROR);
      throw new ResponseStatusException(errorCode, e.getMessage());
    }
  }
  
  @GetMapping("/{datasourceId}" + Mappings.DATAIMPORT_PATH)
  @Transactional
  public Iterable<DataImport.MetaData> getDataImports(@PathVariable Long datasourceId) {
    return this.handleErrors(() -> {
      Collection<DataImport> dataImports = datasourceManager.getDataImportsForDatasource(datasourceId);
      Collection<DataImport.MetaData> metadatas = dataImports
        .stream()
        .map((DataImport dataImport) -> dataImport.getMetaData())
        .collect(Collectors.toList());
      return  metadatas;
    });
  }

  @GetMapping("/{datasourceId}" + Mappings.DATAIMPORT_PATH + Mappings.LATEST_PATH)
  @Transactional
  public DataImport.MetaData getLatestDataImport(@PathVariable Long datasourceId) {
    return this.handleErrors(() -> {
      DataImport latestDataImport = datasourceManager.getLatestDataImportForDatasource(datasourceId);
      return latestDataImport.getMetaData();
    });
  }

  @GetMapping("/{datasourceId}" + Mappings.DATAIMPORT_PATH + Mappings.LATEST_PATH + Mappings.DATA_PATH)
  @Transactional
  public String getLatestDataImportData(@PathVariable Long datasourceId) {
    return this.handleErrors(() -> {
      DataImport latestDataImport = datasourceManager.getLatestDataImportForDatasource(datasourceId);
      return latestDataImport.getData();
    });
  }

  @GetMapping("/{datasourceId}" + Mappings.DATAIMPORT_PATH + "/{dataImportId}")
  @Transactional
  public DataImport.MetaData getDataImport(@PathVariable Long datasourceId, @PathVariable Long dataImportId) {
    return this.handleErrors(() -> {
      DataImport dataImport = datasourceManager.getDataImportForDatasource(datasourceId, dataImportId);
      return dataImport.getMetaData();
    });
  }

  @GetMapping(value = "/{datasourceId}" + Mappings.DATAIMPORT_PATH + "/{dataImportId}" + Mappings.DATA_PATH, produces = "application/json")
  @Transactional 
  public String getData(@PathVariable Long datasourceId, @PathVariable Long dataImportId) {
    return this.handleErrors(() -> {
      DataImport dataImport = datasourceManager.getDataImportForDatasource(datasourceId, dataImportId);
      return dataImport.getData();
    });
  }
}
