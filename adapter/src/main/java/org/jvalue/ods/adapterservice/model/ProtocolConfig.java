package org.jvalue.ods.adapterservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.validation.constraints.NotNull;
import java.util.Objects;

public class ProtocolConfig {

    @NotNull
    public final String protocol;

    @NotNull
    public final String location;

    @JsonCreator
    public ProtocolConfig(
            @JsonProperty("type") String protocol,
            @JsonProperty("location") String location) {
        this.protocol = protocol;
        this.location = location;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProtocolConfig config = (ProtocolConfig) o;
        return protocol.equals(config.protocol) &&
                location.equals(config.location);
    }

    @Override
    public int hashCode() {
        return Objects.hash(protocol, location);
    }
}
