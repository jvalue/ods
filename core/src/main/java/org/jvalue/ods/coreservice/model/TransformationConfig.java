package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Embeddable
public class TransformationConfig {

    @NotNull
    @Column(length = 10000)
    private String func;

    private String data;


    //Constructor for JPA
    private TransformationConfig() {
    }

    @JsonCreator
    public TransformationConfig(
            @JsonProperty("func") String func,
            @JsonProperty("data") String data) {
        this.func = func;
        this.data = data;
    }

    @Override
    public String toString() {
        return "TransformationConfig{" +
                "func='" + func + '\'' +
                ", data=" + data +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TransformationConfig that = (TransformationConfig) o;
        return func.equals(that.func) &&
                data.equals(that.data);
    }

    @Override
    public int hashCode() {
        int result = Objects.hash(func);
        result = 31 * result + Objects.hash(data);
        return result;
    }

    public String getFunc() {
        return func;
    }

    public String getData() {
        return data;
    }
}
