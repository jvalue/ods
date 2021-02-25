package org.jvalue.ods.adapterservice.datasource.model.exceptions;

import org.jvalue.ods.adapterservice.adapter.model.exceptions.AdapterException;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class DataImportNotFoundException extends AdapterException {
  private Long datasourceId;
  private Long dataImportId;

  public String getMessage() {
    return "Could not find data import with id " + dataImportId + " for datasource " + datasourceId;
  }
}
