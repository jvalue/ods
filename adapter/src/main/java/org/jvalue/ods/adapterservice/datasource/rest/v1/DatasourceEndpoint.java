package org.jvalue.ods.adapterservice.datasource.rest.v1;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.AdapterFactory;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.jvalue.ods.adapterservice.datasource.DatasourceManager;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.DatasourceParameters;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.validation.Valid;
import java.net.URI;


@RestController
@RequestMapping("/datasources")
public class DatasourceEndpoint {

    private final DatasourceManager datasourceManager;
    private final AdapterFactory adapterFactory;

    @Autowired
    public DatasourceEndpoint(DatasourceManager datasourceManager, AdapterFactory adapterFactory) {
        this.datasourceManager = datasourceManager;
      this.adapterFactory = adapterFactory;
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
    public DataBlob.MetaData getData(@PathVariable() Long id, @Valid @RequestBody DatasourceParameters datasourceParameters) {
      Datasource datasource = datasourceManager.getDatasource(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No datasource found with id " + id));
      try {
        String url = (String) datasource.getProtocol().getParameters().get("location");
      } catch (Exception e) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No baseurl for this datasource");
      }
      if (datasourceParameters.parameters != null) {
        datasourceParameters.parameters.forEach((k,v) -> {
          System.out.println(k); // fill parameters
        });
      }
      try {
        Adapter adapter = adapterFactory.getAdapter(datasource.toAdapterConfig());
        return adapter.executeJob(datasource.toAdapterConfig());
      } catch (Exception e) {
        if(e instanceof HttpMessageNotReadableException) {
          System.err.println("Data Import request failed. Malformed Request: " + e.getMessage());
          throw e;
        }
        String location = datasource.toAdapterConfig().protocolConfig.parameters.get("location").toString();
        if(location != null) {
          System.err.println("Importing data from " + location + " failed.\n" +
            "Reason: " + e.getClass().getName() + ": " + e.getMessage());
        } else {
          System.err.println("Data Import failed. Reason: " + e.getClass() + ": " +e.getMessage());
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
}
