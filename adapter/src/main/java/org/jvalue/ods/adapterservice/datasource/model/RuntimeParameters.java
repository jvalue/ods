package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.lang.Nullable;

import java.util.Map;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class RuntimeParameters {

  @Nullable
  private final Map<String, String> parameters;

  @JsonCreator
  public RuntimeParameters(@JsonProperty("parameters") Map<String, String> parameters) {
    this.parameters = parameters;
  }
}
