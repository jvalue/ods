package org.jvalue.ods.adapterservice.datasource.event;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

public class ImportFailedEvent implements Serializable {

    private final Long datasourceId;

    private final String errmsg;

    public ImportFailedEvent(@JsonProperty("datasourceId") Long datasourceId, @JsonProperty("error") String errmsg) {
        this.datasourceId = datasourceId;
        this.errmsg = errmsg;
    }

    @Override
    public String toString() {
        return "ImportFailedEvent{" +
                "datasourceId=" + datasourceId +
                ", errmsg='" + errmsg + '\'' +
                '}';
    }

    public Long getDatasourceId() {
        return datasourceId;
    }

    public String getErrmsg() {
        return errmsg;
    }

}
