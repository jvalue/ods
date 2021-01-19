package org.jvalue.ods.adapterservice.datasource.event;

import lombok.*;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode
public class DatasourceConfigEvent {
  private Datasource datasource;
}
