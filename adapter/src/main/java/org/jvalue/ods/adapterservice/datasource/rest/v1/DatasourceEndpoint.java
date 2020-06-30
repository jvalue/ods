package org.jvalue.ods.adapterservice.datasource.rest.v1;

import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.jvalue.ods.adapterservice.datasource.DatasourceManager;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.DatasourceParameters;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
          config.setId(null); // id not under control of client

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
            datasourceManager.updateDatasource(id, updateConfig);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Datasource needs to exist before updating", e);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDatasource(@PathVariable Long id) {
        datasourceManager.deleteDatasource(id);
    }

    @DeleteMapping("/")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAllDatasources() {
        datasourceManager.deleteAllDatasources();
    }

    @PostMapping("/{id}/trigger")
    public DataBlob.MetaData getData(@PathVariable() Long id,
                                     @Valid @RequestBody DatasourceParameters datasourceParameters) {
      try {
        return datasourceManager.trigger(id, datasourceParameters);
      } catch (IllegalArgumentException e) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No valid Datasource for id "+ id);
      }
    }
}
