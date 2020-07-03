package org.jvalue.ods.adapterservice.datasource.event;

public class DatesourceImportedEvent {
  private final Long datasourceId;
  private final String dataLocation;

  public DatesourceImportedEvent(Long datasourceId, String dataLocation) {
    this.datasourceId = datasourceId;
    this.dataLocation = dataLocation;
  }

  public Long getDatasourceId() {
    return this.datasourceId;
  }

  public String getDataLocation() {
    return this.dataLocation;
  }
}
