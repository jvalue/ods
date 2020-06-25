package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Map;
import java.util.Objects;

public class DatasourceParameters {

  public final Map<String, Object> parameters;

  @JsonCreator
  public DatasourceParameters(Map<String, Object> parameters) {
    this.parameters = parameters;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof DatasourceParameters)) return false;
    DatasourceParameters that = (DatasourceParameters) o;
    return Objects.equals(parameters, that.parameters);
  }

  @Override
  public int hashCode() {
    return Objects.hash(parameters);
  }
}
