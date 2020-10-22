package org.jvalue.ods.adapterservice.adapter.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jvalue.ods.adapterservice.adapter.Protocol;

import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.Objects;

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

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    ProtocolConfig config = (ProtocolConfig) o;
    return protocol.equals(config.protocol) &&
      parameters.equals(config.parameters);
  }

  @Override
  public int hashCode() {
    return Objects.hash(protocol, parameters);
  }
}
