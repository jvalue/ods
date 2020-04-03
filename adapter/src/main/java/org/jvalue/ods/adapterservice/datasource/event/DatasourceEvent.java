package org.jvalue.ods.adapterservice.datasource.event;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Entity
public class DatasourceEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;

    @NotNull
    private EventType eventType;

    @NotNull
    private Long datasourceId;


    //Constructor for JPA
    private DatasourceEvent() {}

    @JsonCreator
    public DatasourceEvent(
            @JsonProperty("eventType") @NotNull EventType eventType,
            @JsonProperty("datasourceId")@NotNull Long datasourceId) {
        this.eventType = eventType;
        this.datasourceId = datasourceId;
    }

    public Long getEventId() {
        return eventId;
    }

    public String getEventType() {
        return eventType.name();
    }

    public Long getDatasourceId() {
        return datasourceId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DatasourceEvent that = (DatasourceEvent) o;
        return eventId.equals(that.eventId) &&
                eventType.equals(that.eventType) &&
          datasourceId.equals(that.datasourceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventId, eventType, datasourceId);
    }
}
