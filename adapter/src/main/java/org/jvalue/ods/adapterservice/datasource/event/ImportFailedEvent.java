package org.jvalue.ods.adapterservice.datasource.event;

import lombok.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode
public class ImportFailedEvent {
  private Long datasourceId;
  private String error;
}
