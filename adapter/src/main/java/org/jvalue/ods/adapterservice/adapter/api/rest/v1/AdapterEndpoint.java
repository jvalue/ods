package org.jvalue.ods.adapterservice.adapter.api.rest.v1;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
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
  public DataBlob.MetaData executeDataImport(@Valid @RequestBody AdapterConfig config) {
    try {
      return adapter.executeJob(config).getMetaData();
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid config: " + e.getMessage());
    } catch (RestClientException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to load data: " + e.getMessage());
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }
  }
}
