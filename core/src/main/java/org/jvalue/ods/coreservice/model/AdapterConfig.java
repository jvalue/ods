package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Embeddable
public class AdapterConfig {

    @NotNull
    private String protocol;

    @NotNull
    private String format;

    @NotNull
    private String location;


    //Constructor for JPA
    private AdapterConfig() {
    }

    @JsonCreator
    public AdapterConfig(
            @JsonProperty("protocol") String protocol,
            @JsonProperty("format") String format,
            @JsonProperty("location") String location) {
        this.protocol = protocol;
        this.format = format;
        this.location = location;
    }

    public String getProtocol() {
        return protocol;
    }

    public String getFormat() {
        return format;
    }

    public String getLocation() {
        return location;
    }

    @Override
    public String toString() {
        return "AdapterConfig{" +
                "protocol='" + protocol + '\'' +
                ", format='" + format + '\'' +
                ", location='" + location + '\'' +
                '}';
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
