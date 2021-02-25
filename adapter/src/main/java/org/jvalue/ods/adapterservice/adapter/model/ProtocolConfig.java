package org.jvalue.ods.adapterservice.adapter.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.EqualsAndHashCode;
import org.jvalue.ods.adapterservice.adapter.Protocol;

import javax.validation.constraints.NotNull;
import java.util.Map;

@EqualsAndHashCode
public class ProtocolConfig {

  @NotNull
  public final Protocol protocol;

  @NotNull
  public final Map<String, Object> parameters;

  @JsonCreator
  public ProtocolConfig(
    @JsonProperty("type") Protocol protocol,
    @JsonProperty("parameters") Map<String, Object> parameters) {
    this.protocol = protocol;
    this.parameters = parameters;
  }
}
