package org.jvalue.ods.adapterservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.validation.constraints.NotNull;
import java.util.Objects;

public class AdapterConfig {

    @NotNull
    public final String protocol;

    @NotNull
    public final String format;

    @NotNull
    public final String location;

    @JsonCreator
    public AdapterConfig(
            @JsonProperty("protocol") String protocol,
            @JsonProperty("format") String format,
            @JsonProperty("location") String location) {
        this.protocol = protocol;
        this.format = format;
        this.location = location;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AdapterConfig config = (AdapterConfig) o;
        return protocol.equals(config.protocol) &&
                format.equals(config.format) &&
                location.equals(config.location);
    }

    @Override
    public int hashCode() {
        return Objects.hash(protocol, format, location);
    }
}
