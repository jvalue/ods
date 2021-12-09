package org.jvalue.ods.adapterservice.datasource.model.amqp;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.jvalue.ods.adapterservice.datasource.model.RuntimeParameters;
import org.springframework.lang.Nullable;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class DatasourceImportTrigger {
  private Long datasourceId;

  @Nullable
  private RuntimeParameters runtimeParameters;

  @JsonCreator
  public DatasourceImportTrigger(@JsonProperty("datasourceId") Long datasourceId, @JsonProperty("runtimeParameters") RuntimeParameters runtimeParameters) {
    this.datasourceId = datasourceId;
    this.runtimeParameters = runtimeParameters;
  }
}
