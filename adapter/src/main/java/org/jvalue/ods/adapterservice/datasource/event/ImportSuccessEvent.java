package org.jvalue.ods.adapterservice.datasource.event;

import lombok.Value;

@Value
public class ImportSuccessEvent {
  Long datasourceId;
  String data;

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
