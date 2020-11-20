package org.jvalue.ods.adapterservice.adapter.api.rest.v1;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;

@RestController
@RequestMapping("/")
public class AdapterEndpoint {

  private final Adapter adapter;

  @Autowired
  public AdapterEndpoint(Adapter adapter) {
    this.adapter = adapter;
  }

  @PostMapping(Mappings.IMPORT_PATH)
  public ResponseEntity<?> executeDataImport(
          @Valid @RequestBody AdapterConfig config,
          @RequestParam(required = false) boolean includeData) {
    try {
      DataBlob imported = adapter.executeJob(config);

      if(includeData) {
        return ResponseEntity.ok(imported.getData());
      }

      return ResponseEntity.ok(imported.getMetaData());

    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid config: " + e.getMessage());
    } catch (RestClientException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to load data: " + e.getMessage());
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }
  }
}
