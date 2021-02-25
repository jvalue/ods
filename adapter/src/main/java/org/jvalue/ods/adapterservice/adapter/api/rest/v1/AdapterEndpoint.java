package org.jvalue.ods.adapterservice.adapter.api.rest.v1;

import lombok.AllArgsConstructor;
import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.model.*;
import org.jvalue.ods.adapterservice.adapter.model.exceptions.*;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

import javax.validation.Valid;

@RestController
@AllArgsConstructor
public class AdapterEndpoint {
  private final Adapter adapter;

  @PostMapping(Mappings.IMPORT_PATH)
  public DataImportResponse executeDataImport(@Valid @RequestBody AdapterConfig config)
      throws ImporterParameterException, InterpreterParameterException, IOException {
    return adapter.executeJob(config);
  }

  @PostMapping(Mappings.RAW_IMPORT_PATH)
  public DataImportResponse executeRawPreview(@Valid @RequestBody ProtocolConfig config)
      throws ImporterParameterException {
    return adapter.executeRawImport(config);
  }
}
