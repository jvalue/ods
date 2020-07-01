package org.jvalue.ods.adapterservice.adapter.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.validation.constraints.NotNull;
import java.util.Objects;

public class AdapterConfig {

    private long dataSourceId;

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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AdapterConfig config = (AdapterConfig) o;
        return protocolConfig.equals(config.protocolConfig) &&
            formatConfig.equals(config.formatConfig);
    }

    @Override
    public int hashCode() {
        return Objects.hash(protocolConfig, formatConfig);
    }

    public long getDataSourceId() {
      return dataSourceId;
    }

    public void setDataSourceId(long id) {
      this.dataSourceId = id;
  }
}
