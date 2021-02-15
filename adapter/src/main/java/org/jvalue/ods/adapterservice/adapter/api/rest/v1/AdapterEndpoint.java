package org.jvalue.ods.adapterservice.adapter.api.rest.v1;

import lombok.AllArgsConstructor;
import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataImportResponse;
import org.jvalue.ods.adapterservice.adapter.model.ProtocolConfig;
import org.jvalue.ods.adapterservice.util.CheckedSupplier;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;

@RestController
@AllArgsConstructor
public class AdapterEndpoint {
  private final Adapter adapter;

  private <T> T handleErrors(CheckedSupplier<T> function) throws ResponseStatusException {
    try {
      return function.get();
    } catch (Exception e) {
      HttpStatus errorCode = Mappings.ERROR_MAPPING.getOrDefault(e.getClass(), HttpStatus.INTERNAL_SERVER_ERROR);
      throw new ResponseStatusException(errorCode, e.getMessage());
    }
  }

  @PostMapping(Mappings.IMPORT_PATH)
  public DataImportResponse executeDataImport(@Valid @RequestBody AdapterConfig config) {
    return this.handleErrors(() -> adapter.executeJob(config));
  }

  @PostMapping(Mappings.RAW_IMPORT_PATH)
  public DataImportResponse executeRawPreview(@Valid @RequestBody ProtocolConfig config) {
    return this.handleErrors(() -> adapter.executeRawImport(config));
  }
}
