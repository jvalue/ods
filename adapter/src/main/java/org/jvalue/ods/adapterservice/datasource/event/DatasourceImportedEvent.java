package org.jvalue.ods.adapterservice.datasource.event;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DatasourceImportedEvent implements Serializable {

  private final Long datasourceId;
  private final String data;

  public DatasourceImportedEvent(@JsonProperty("datasourceId") final Long datasourceId, @JsonProperty("data") final String data) {
    this.datasourceId = datasourceId;
    this.data = data;
  }

  public Long getDatasourceId() {
    return this.datasourceId;
  }

  public String getData() {
    return this.data;
  }

  @Override
  public String toString() {
    return "DatasourceImportedEvent{" +
            "datasourceId=" + datasourceId +
            ", dataLocation='" + dataLocation + '\'' +
            '}';
  }
}
