package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.List;
import java.util.Objects;

@Entity
public class PipelineConfig implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Embedded @NotNull
    private AdapterConfig adapter;

    @ElementCollection @NotNull
    private List<TransformationConfig> transformations;

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
        this.adapter = adapter;
        this.transformations = transformations;
        this.trigger = trigger;
        this.metadata = metadata;
    }


    @Override
    public String toString() {
        return "PipelineConfig{" +
                "id=" + id +
                ", adapter=" + adapter +
                ", transformations=" + transformations.toString() +
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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
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

    public PipelineTriggerConfig getTrigger() {
        return trigger;
    }

    public void setTrigger(PipelineTriggerConfig trigger) {
        this.trigger = trigger;
    }

    public PipelineMetadata getMetadata() {
        return metadata;
    }

    /**
     * Create an updated PipelineConfig using the full representation of an update. This method ensures that id and creation time remain stable.
     * @param updateConfig the representation of the updated config
     * @return an updated PipelineConfig that has the same id and creationTimestamp as the original one.
     */
    public PipelineConfig applyUpdate(PipelineConfig updateConfig) {
        PipelineMetadata updatedMetadata = new PipelineMetadata(
                updateConfig.metadata.getAuthor(), 
                updateConfig.metadata.getLicense(),
                updateConfig.metadata.getDisplayName(),
                updateConfig.metadata.getDescription());
        updatedMetadata.setCreationTimestamp(this.getMetadata().getCreationTimestamp());

        PipelineConfig updated = new PipelineConfig(
                updateConfig.adapter,
                updateConfig.transformations,
                updateConfig.trigger,
                updatedMetadata);
        updated.setId(this.id);

        return updated;
    }
}
