package org.jvalue.ods.coreservice.model.adapter;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Embeddable
public class AdapterConfig {

    @NotNull
    private AdapterProtocolConfig protocol;

    @NotNull
    private AdapterFormatConfig format;


    //Constructor for JPA
    private AdapterConfig() {
    }

    @JsonCreator
    public AdapterConfig(
            @JsonProperty("protocol") AdapterProtocolConfig protocol,
            @JsonProperty("format") AdapterFormatConfig format) {
        this.protocol = protocol;
        this.format = format;
    }

    public AdapterProtocolConfig getProtocol() {
        return protocol;
    }

    public AdapterFormatConfig getFormat() {
        return format;
    }

    @Override
    public String toString() {
        return "AdapterConfig{" +
                "protocol='" + protocol + '\'' +
                ", format='" + format + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AdapterConfig config = (AdapterConfig) o;
        return protocol.equals(config.protocol) &&
                format.equals(config.format);
    }

    @Override
    public int hashCode() {
        return Objects.hash(protocol, format);
    }
}
