package org.jvalue.ods.adapterservice.datasource.event;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;

import java.io.Serializable;
import java.util.Objects;

public class DatasourceConfigEvent implements Serializable {

    private final Datasource datasource;

    public DatasourceConfigEvent(@JsonProperty("datasource") Datasource datasource) {
        this.datasource = datasource;
    }

    @Override
    public String toString() {
        return "DatasourceConfigEvent{" +
                "datasource=" + datasource +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DatasourceConfigEvent that = (DatasourceConfigEvent) o;
        return Objects.equals(datasource, that.datasource);
    }

    @Override
    public int hashCode() {
        return Objects.hash(datasource);
    }

    public Datasource getDatasource() {
        return datasource;
    }
}
