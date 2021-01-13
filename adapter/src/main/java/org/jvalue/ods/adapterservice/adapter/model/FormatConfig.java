package org.jvalue.ods.adapterservice.adapter.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.EqualsAndHashCode;
import org.jvalue.ods.adapterservice.adapter.Format;

import javax.validation.constraints.NotNull;
import java.util.Map;

@EqualsAndHashCode
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
}
