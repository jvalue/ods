package org.jvalue.ods.adapterservice.datasource.event;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

public class ImportFailedEvent implements Serializable {

    private final Long datasourceId;

    private final String error;

    public ImportFailedEvent(@JsonProperty("datasourceId") Long datasourceId, @JsonProperty("error") String error) {
        this.datasourceId = datasourceId;
        this.error = error;
    }

    @Override
    public String toString() {
        return "ImportFailedEvent{" +
                "datasourceId=" + datasourceId +
                ", errmsg='" + error + '\'' +
                '}';
    }

    public Long getDatasourceId() {
        return datasourceId;
    }

    public String getError() {
        return error;
    }

}
