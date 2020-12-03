package org.jvalue.ods.adapterservice.datasource.api.rest.v1;

import org.jvalue.ods.adapterservice.adapter.Format;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.jvalue.ods.adapterservice.datasource.DatasourceManager;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.RuntimeParameters;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.validation.Valid;
import java.net.URI;


@RestController
@RequestMapping("/datasources")
public class DatasourceEndpoint {
  private final DatasourceManager datasourceManager;

  @Autowired
  public DatasourceEndpoint(DatasourceManager datasourceManager) {
    this.datasourceManager = datasourceManager;
  }

  @GetMapping
  public Iterable<Datasource> getDatasources() {
    return datasourceManager.getAllDatasources();
  }

  @GetMapping("/{id}")
  public Datasource getDatasource(@PathVariable Long id) {
    return datasourceManager.getDatasource(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Could not find datasource with id " + id));
  }

  @PostMapping
  public ResponseEntity<Datasource> addDatasource(@Valid @RequestBody Datasource config) {
    if (config.getId() != null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Id is defined by the server. Id field must not be set");
    }
    if (config.getFormat().getType() == Format.RAW) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Datasources with RAW format are not allowed.");
    }

    Datasource savedConfig = datasourceManager.createDatasource(config);

    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
      .path("/{id}")
      .buildAndExpand(savedConfig.getId())
      .toUri();

    return ResponseEntity.created(location).body(savedConfig);
  }

  @PutMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void updateDatasource(
    @PathVariable Long id,
    @Valid @RequestBody Datasource updateConfig) {
    try {
      if (updateConfig.getFormat().getType() == Format.RAW) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Datasources with RAW format are not allowed.");
      }
      datasourceManager.updateDatasource(id, updateConfig);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Datasource needs to exist before updating", e);
    }
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteDatasource(@PathVariable Long id) {
    try {
      datasourceManager.deleteDatasource(id);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Can not find Datasource with id: " + id, e);
    }
  }

  @DeleteMapping("/")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteAllDatasources() {
    datasourceManager.deleteAllDatasources();
  }

  @PostMapping("/{id}/trigger")
  public DataBlob.MetaData getData(@PathVariable Long id,
                                   @Valid @RequestBody(required = false) RuntimeParameters runtimeParameters) {
    datasourceManager.getDatasource(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Can not find Datasource with id: " + id));
    try {
      return datasourceManager.trigger(id, runtimeParameters);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid datasource or parameters: " + e.getMessage());
    } catch (RestClientException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to load data: " + e.getMessage());
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }
  }
}
