package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
public class PipelineConfig implements Serializable {

    @Id
    private String id;

    @Embedded @NotNull
    private AdapterConfig adapter;

    @ElementCollection
    private List<TransformationConfig> transformations;

    @Embedded @NotNull
    private DataPersistenceConfig persistence;

    @Embedded @NotNull
    private PipelineTriggerConfig trigger;

    @Embedded @NotNull
    private PipelineMetadata metadata;


    //Constructor for JPA
    private PipelineConfig() {}

    @JsonCreator
    public PipelineConfig(
            @JsonProperty("adapter") AdapterConfig adapter,
            @JsonProperty("transformations") List<TransformationConfig> transformations,
            @JsonProperty("trigger") PipelineTriggerConfig trigger,
            @JsonProperty("metadata") PipelineMetadata metadata) {
        this.id = UUID.randomUUID().toString();
        this.adapter = adapter;
        this.transformations = transformations;
        this.persistence = new DataPersistenceConfig(id);
        this.trigger = trigger;
        this.metadata = metadata;
    }


    @Override
    public String toString() {
        return "PipelineConfig{" +
                "id=" + id +
                ", adapter=" + adapter +
                ", transformations=" + transformations.toString() +
                ", persistence=" + persistence +
                ", trigger=" + trigger +
                ", metadata=" + metadata +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PipelineConfig that = (PipelineConfig) o;
        return id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public AdapterConfig getAdapter() {
        return adapter;
    }

    public void setAdapter(AdapterConfig adapter) {
        this.adapter = adapter;
    }

    public List<TransformationConfig> getTransformations() {
        return transformations;
    }

    public void setTransformations(List<TransformationConfig> transformations) {
        this.transformations = transformations;
    }

    public DataPersistenceConfig getPersistence() {
        return persistence;
    }

    public void setPersistence(DataPersistenceConfig persistence) {
        this.persistence = persistence;
    }

    public PipelineTriggerConfig getTrigger() {
        return trigger;
    }

    public void setTrigger(PipelineTriggerConfig trigger) {
        this.trigger = trigger;
    }

    public PipelineMetadata getMetadata() {
        return metadata;
    }

    public void setMetadata(PipelineMetadata metadata) {
        this.metadata = metadata;
    }
}
