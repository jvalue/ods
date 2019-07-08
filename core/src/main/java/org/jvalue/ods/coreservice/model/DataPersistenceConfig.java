package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Embeddable
public class DataPersistenceConfig {
    @NotNull
    private String pipelineId;


    //Constructor for JPA
    private DataPersistenceConfig() {
    }

    @JsonCreator
    public DataPersistenceConfig(String pipelineId) {
        this.pipelineId = pipelineId;
    }

    @Override
    public String toString() {
        return "DataPersistenceConfig{" +
                "pipelineid=" + pipelineId +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DataPersistenceConfig that = (DataPersistenceConfig) o;
        return pipelineId.equals(that.pipelineId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(pipelineId);
    }

    public String getPipelineid() {
        return pipelineId;
    }
}
