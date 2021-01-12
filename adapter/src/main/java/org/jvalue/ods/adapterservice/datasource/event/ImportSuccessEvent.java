package org.jvalue.ods.adapterservice.datasource.event;

public class ImportSuccessEvent {
  private final Long datasourceId;
  private final String data;

  public ImportSuccessEvent(Long datasourceId, String data) {
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
      ", data='" + shortDataRepresentation() + '\'' +
      '}';
  }

  private String shortDataRepresentation() {
    if (data.length() > 20) {
      return data.substring(0, 10) + "[...]" + data.substring(data.length() - 10);
    }
    return data;
  }
}
