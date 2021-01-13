package org.jvalue.ods.adapterservice.datasource.event;

import lombok.Value;

@Value
public class ImportFailedEvent {
  Long datasourceId;
  String error;
}
