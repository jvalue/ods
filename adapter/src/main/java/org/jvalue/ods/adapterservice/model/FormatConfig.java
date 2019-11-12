package org.jvalue.ods.adapterservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.validation.constraints.NotNull;
import java.util.Objects;

public class FormatConfig {

    @NotNull
    public final String format;

    @JsonCreator
    public FormatConfig(
            @JsonProperty("type") String format) {
        this.format = format;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FormatConfig config = (FormatConfig) o;
        return format.equals(config.format);
    }

    @Override
    public int hashCode() {
        return Objects.hash(format);
    }
}
