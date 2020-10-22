package org.jvalue.ods.adapterservice.adapter.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jvalue.ods.adapterservice.adapter.Format;

import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.Objects;

public class FormatConfig {

  @NotNull
  public final Format format;

  @NotNull
  public final Map<String, Object> parameters;

  @JsonCreator
  public FormatConfig(
    @JsonProperty("type") Format format,
    @JsonProperty("parameters") Map<String, Object> parameters) {
    this.format = format;
    this.parameters = parameters;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    FormatConfig config = (FormatConfig) o;
    return format.equals(config.format) &&
      parameters.equals(config.parameters);
  }

  @Override
  public int hashCode() {
    return Objects.hash(format, parameters);
  }
}
