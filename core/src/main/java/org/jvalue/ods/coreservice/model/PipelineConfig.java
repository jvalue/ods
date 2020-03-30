package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jvalue.ods.coreservice.model.adapter.AdapterConfig;
import org.jvalue.ods.coreservice.model.notification.NotificationConfig;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.List;
import java.util.Objects;

@Entity
public class PipelineConfig implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") // referenced by embedded adapter config for format and protocol
    private Long id;

    @Embedded @NotNull
    private AdapterConfig adapter;

    @Embedded
    private TransformationConfig transformation;

    @Embedded @NotNull
    private PipelineTriggerConfig trigger;

    @Embedded @NotNull
    private PipelineMetadata metadata;

    @OneToMany(cascade = CascadeType.ALL)
    private List<NotificationConfig> notifications;

    //Constructor for JPA
    public PipelineConfig() {}

    @JsonCreator
    public PipelineConfig(
            @JsonProperty("adapter") AdapterConfig adapter,
            @JsonProperty("transformation") TransformationConfig transformation,
            @JsonProperty("trigger") PipelineTriggerConfig trigger,
            @JsonProperty("metadata") PipelineMetadata metadata,
            @JsonProperty("notifications") List<NotificationConfig> notifications) {
        this.adapter = adapter;
        this.transformation = transformation;
        this.trigger = trigger;
        this.metadata = metadata;
        this.notifications = notifications;
    }

    @Override
    public String toString() {
        return "PipelineConfig{" +
                "id=" + id +
                ", adapter=" + adapter +
                ", transformation=" + transformation.toString() +
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

    public TransformationConfig getTransformation() {
        return transformation;
    }

    public void setTransformation(TransformationConfig transformation) {
        this.transformation = transformation;
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

    public List<NotificationConfig> getNotifications() {
        return notifications;
    }

    public void addNotification(NotificationConfig notification) {
        this.notifications.add(notification);
    }

    public void removeNotification(NotificationConfig notification) {
        this.notifications.remove(notification);
    }
 }
