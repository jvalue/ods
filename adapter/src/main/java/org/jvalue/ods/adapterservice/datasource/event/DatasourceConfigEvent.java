package org.jvalue.ods.adapterservice.datasource.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;

import java.io.Serializable;
import java.util.Objects;

public class DatasourceConfigEvent implements Serializable {

    private final Long datasourceId;

    public DatasourceConfigEvent(@JsonProperty("datasourceId") Long datasourceId) {
        this.datasourceId = datasourceId;
    }

    public DatasourceConfigEvent(Datasource datasource) {
        this.datasourceId = datasource.getId();
    }

    @Override
    public String toString() {
        return "DatasourceConfigEvent{" +
                "datasourceId=" + datasourceId +
                '}';
    }

    public Long getDatasourceId() {
        return datasourceId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DatasourceConfigEvent that = (DatasourceConfigEvent) o;
        return Objects.equals(datasourceId, that.datasourceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(datasourceId);
    }
}
