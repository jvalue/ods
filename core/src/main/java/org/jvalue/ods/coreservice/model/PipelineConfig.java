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

    @ElementCollection @NotNull
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
        this.persistence = new DataPersistenceConfig(this.id);
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

    private void setId(String id) {
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

    /**
     * Create an updated PipelineConfig using the full representation of an update. This method ensures that id and creation time remain stable.
     * @param updateConfig the representation of the updated config
     * @return an updated PipelineConfig that has the same id and creationTimestamp as the original one.
     */
    public PipelineConfig applyUpdate(PipelineConfig updateConfig) {
        PipelineMetadata updatedMetadata = new PipelineMetadata(updateConfig.metadata.getAuthor(), updateConfig.metadata.getLicense());
        updatedMetadata.setCreationTimestamp(this.getMetadata().getCreationTimestamp());
        DataPersistenceConfig updatedPersistence = new DataPersistenceConfig(this.id);

        PipelineConfig updated = new PipelineConfig(
                updateConfig.adapter,
                updateConfig.transformations,
                updateConfig.trigger,
                updatedMetadata);
        updated.setId(this.id);
        updated.setPersistence(updatedPersistence);

        return updated;
    }

    /**
     * Create a new UUID that is be used as id.
     */
    public void renewId() {
        this.id = UUID.randomUUID().toString();
        this.persistence = new DataPersistenceConfig(this.id);
    }
}
