package org.jvalue.ods.adapterservice.datasource.event;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DatasourceImportedEvent implements Serializable {

  private final Long datasourceId;
  private final String dataLocation;

  public DatasourceImportedEvent(@JsonProperty("datasourceId") final Long datasourceId, @JsonProperty("dataLocation") final String dataLocation) {
    this.datasourceId = datasourceId;
    this.dataLocation = dataLocation;
  }

  public Long getDatasourceId() {
    return this.datasourceId;
  }

  public String getDataLocation() {
    return this.dataLocation;
  }

  @Override
  public String toString() {
    return "DatasourceImportedEvent{" +
            "datasourceId=" + datasourceId +
            ", dataLocation='" + dataLocation + '\'' +
            '}';
  }
}
