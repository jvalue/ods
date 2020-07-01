package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import org.springframework.lang.Nullable;

import java.util.Map;
import java.util.Objects;

public class RuntimeParameters {

  @Nullable
  public final Map<String, String> parameters;

  @JsonCreator
  public RuntimeParameters(Map<String, String> parameters) {
    this.parameters = parameters;
  }

  @Override
  public String toString() {
    return "RuntimeParameters{" +
      "parameters=" + parameters +
      '}';
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof RuntimeParameters)) return false;
    RuntimeParameters that = (RuntimeParameters) o;
    return Objects.equals(parameters, that.parameters);
  }

  @Override
  public int hashCode() {
    return Objects.hash(parameters);
  }
}
