package org.jvalue.ods.adapterservice.adapter.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotNull;

@EqualsAndHashCode
public class AdapterConfig {

  @NotNull
  public final ProtocolConfig protocolConfig;

  @NotNull
  public final FormatConfig formatConfig;

  @JsonCreator
  public AdapterConfig(
    @JsonProperty("protocol") ProtocolConfig protocolConfig,
    @JsonProperty("format") FormatConfig formatConfig) {
    this.protocolConfig = protocolConfig;
    this.formatConfig = formatConfig;
  }
}
