package org.jvalue.ods.adapterservice.datasource.event;

public class ImportFailedEvent {
  private final Long datasourceId;
  private final String error;

  public ImportFailedEvent(Long datasourceId, String error) {
    this.datasourceId = datasourceId;
    this.error = error;
  }

  @Override
  public String toString() {
    return "ImportFailedEvent{" +
      "datasourceId=" + datasourceId +
      ", errmsg='" + error + '\'' +
      '}';
  }

  public Long getDatasourceId() {
    return datasourceId;
  }

  public String getError() {
    return error;
  }

}
