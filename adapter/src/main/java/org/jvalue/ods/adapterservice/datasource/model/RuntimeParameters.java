package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.*;
import org.springframework.lang.Nullable;

import java.util.Map;
import java.util.Objects;

@Getter
@Setter
@ToString
@EqualsAndHashCode
public class RuntimeParameters {

  @Nullable
  private final Map<String, String> parameters;

  @JsonCreator
  public RuntimeParameters(Map<String, String> parameters) {
    this.parameters = parameters;
  }
}
