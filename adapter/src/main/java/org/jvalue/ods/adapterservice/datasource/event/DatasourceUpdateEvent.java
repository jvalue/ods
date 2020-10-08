package org.jvalue.ods.adapterservice.datasource.event;

import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.DatasourceTrigger;

import java.util.Objects;

public class DatasourceUpdateEvent extends DatasourceConfigEvent {

    private final DatasourceTrigger trigger;

    public DatasourceUpdateEvent(Datasource datasource) {
        super(datasource);
        this.trigger = datasource.getTrigger();
    }

    public DatasourceTrigger getTrigger() {
        return trigger;
    }

    @Override
    public String toString() {
        return "DatasourceCreationEvent{" +
                "trigger=" + trigger +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        DatasourceUpdateEvent that = (DatasourceUpdateEvent) o;
        return Objects.equals(trigger, that.trigger);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), trigger);
    }
}
