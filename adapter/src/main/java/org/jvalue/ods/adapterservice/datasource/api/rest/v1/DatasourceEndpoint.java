package org.jvalue.ods.adapterservice.datasource.api.rest.v1;

import lombok.AllArgsConstructor;

import org.jvalue.ods.adapterservice.datasource.DatasourceManager;
import org.jvalue.ods.adapterservice.datasource.model.DataImport;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.RuntimeParameters;
import org.jvalue.ods.adapterservice.util.CheckedSupplier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.validation.Valid;
import java.net.URI;

@AllArgsConstructor
@RestController
@RequestMapping(Mappings.DATASOURCE_PATH)
public class DatasourceEndpoint {
  private final DatasourceManager datasourceManager;

  private <T> T handleErrors(CheckedSupplier<T> function) throws ResponseStatusException {
    try {
      return function.get();
    } catch (Exception e) {
      HttpStatus errorCode = Mappings.ERROR_MAPPING.getOrDefault(e.getClass(), HttpStatus.INTERNAL_SERVER_ERROR);
      throw new ResponseStatusException(errorCode, e.getMessage());
    }
  }

  @GetMapping
  public Iterable<Datasource> getDatasources() {
    return datasourceManager.getAllDatasources();
  }

  @GetMapping("/{id}")
  public Datasource getDatasource(@PathVariable Long id) {
    return this.handleErrors(() -> datasourceManager.getDatasource(id));
  }

  @PostMapping
  public ResponseEntity<Datasource> addDatasource(@Valid @RequestBody Datasource config) {
    return this.handleErrors(() -> {
      Datasource savedConfig = datasourceManager.createDatasource(config);
      URI location = ServletUriComponentsBuilder.fromCurrentRequest()
      .path("/{id}")
      .buildAndExpand(savedConfig.getId())
      .toUri();
      
      return ResponseEntity.created(location).body(savedConfig);
    });
  }

  @PutMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void updateDatasource(@PathVariable Long id, @Valid @RequestBody Datasource updateConfig) {
    this.handleErrors(() -> { datasourceManager.updateDatasource(id, updateConfig); return null;});
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteDatasource(@PathVariable Long id) {
    this.handleErrors(() -> { datasourceManager.deleteDatasource(id); return null; });
  }

  @DeleteMapping("/")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteAllDatasources() {
    datasourceManager.deleteAllDatasources();
  }

  @PostMapping("/{id}/trigger")
  public DataImport.MetaData getData(@PathVariable Long id, @Valid @RequestBody(required = false) RuntimeParameters runtimeParameters) {
    return this.handleErrors(() -> { 
      datasourceManager.getDatasource(id);
      return datasourceManager.trigger(id, runtimeParameters);
    });                          
  }
}
