package org.jvalue.ods.adapterservice.datasource.api.rest.v1;

import lombok.AllArgsConstructor;

import org.jvalue.ods.adapterservice.adapter.interpreter.JsonInterpreter;
import org.jvalue.ods.adapterservice.adapter.model.exceptions.AdapterException;
import org.jvalue.ods.adapterservice.datasource.DatasourceManager;
import org.jvalue.ods.adapterservice.datasource.model.*;
import org.jvalue.ods.adapterservice.datasource.model.exceptions.DatasourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.validation.Valid;

import java.io.IOException;
import java.net.URI;

@AllArgsConstructor
@RestController
@RequestMapping(Mappings.DATASOURCE_PATH)
public class DatasourceEndpoint {
  private final DatasourceManager datasourceManager;

  @GetMapping
  public Iterable<Datasource> getDatasources() {
    return datasourceManager.getAllDatasources();
  }

  @GetMapping("/{id}")
  public Datasource getDatasource(@PathVariable Long id) throws DatasourceNotFoundException {
    return datasourceManager.getDatasource(id);
  }

  @PostMapping
  public ResponseEntity<Datasource> addDatasource(@Valid @RequestBody Datasource config) {
    Datasource savedConfig = datasourceManager.createDatasource(config);
    URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(savedConfig.getId())
        .toUri();

    return ResponseEntity.created(location).body(savedConfig);
  }

  @PutMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void updateDatasource(@PathVariable Long id, @Valid @RequestBody Datasource updateConfig)
      throws DatasourceNotFoundException {
    datasourceManager.updateDatasource(id, updateConfig);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteDatasource(@PathVariable Long id) throws DatasourceNotFoundException {
    datasourceManager.deleteDatasource(id);
  }

  @DeleteMapping("/")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteAllDatasources() {
    datasourceManager.deleteAllDatasources();
  }

  @PostMapping("/{id}/trigger")
  public DataImport.MetaData getData(@PathVariable Long id,
      @Valid @RequestBody(required = false) RuntimeParameters runtimeParameters) throws AdapterException, IOException {
    datasourceManager.getDatasource(id);
    return datasourceManager.trigger(id, runtimeParameters);
  }
}
