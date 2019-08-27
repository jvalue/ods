package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Entity
public class PipelineEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;

    @NotNull
    private EventType eventType;

    @NotNull
    private Long pipelineId;


    //Constructor for JPA
    private PipelineEvent() {}

    @JsonCreator
    public PipelineEvent(
            @JsonProperty("eventType") @NotNull EventType eventType,
            @JsonProperty("pipelineConfig")@NotNull Long pipelineId) {
        this.eventType = eventType;
        this.pipelineId = pipelineId;
    }

    public Long getEventId() {
        return eventId;
    }

    public String getEventType() {
        return eventType.name();
    }

    public Long getPipelineId() {
        return pipelineId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PipelineEvent that = (PipelineEvent) o;
        return eventId.equals(that.eventId) &&
                eventType.equals(that.eventType) &&
                pipelineId.equals(that.pipelineId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventId, eventType, pipelineId);
    }
}
