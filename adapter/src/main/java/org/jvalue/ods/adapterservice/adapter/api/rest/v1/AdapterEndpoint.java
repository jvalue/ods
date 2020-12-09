package org.jvalue.ods.adapterservice.adapter.api.rest.v1;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataImportResponse;
import org.jvalue.ods.adapterservice.adapter.model.ProtocolConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
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
  public DataImportResponse executeDataImport(@Valid @RequestBody AdapterConfig config) {
    try {
      return adapter.executeJob(config);
    } catch (ResponseStatusException e) {
      throw e;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }
  }

  @PostMapping(Mappings.RAW_IMPORT_PATH)
  public DataImportResponse executeRawPreview(@Valid @RequestBody ProtocolConfig config) {
    try {
      return adapter.executeRawImport(config);
    } catch (ResponseStatusException e) {
      throw e;
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
    }
  }
}
