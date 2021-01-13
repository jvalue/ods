package org.jvalue.ods.adapterservice.datasource.event;

import lombok.Value;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;

@Value
public class DatasourceConfigEvent {
  Datasource datasource;
}
