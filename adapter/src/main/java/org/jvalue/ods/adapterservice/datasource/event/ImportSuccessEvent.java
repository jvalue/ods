package org.jvalue.ods.adapterservice.datasource.event;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ImportSuccessEvent {
  private Long datasourceId;
  private String data;

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
