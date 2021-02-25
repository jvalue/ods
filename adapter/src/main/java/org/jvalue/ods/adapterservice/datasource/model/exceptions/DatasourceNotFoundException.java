package org.jvalue.ods.adapterservice.datasource.model.exceptions;

import org.jvalue.ods.adapterservice.adapter.model.exceptions.AdapterException;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class DatasourceNotFoundException extends AdapterException {
  private Long datasourceId;

  public String getMessage() {
    return "Could not find datasource with id " + datasourceId;
  }
}
