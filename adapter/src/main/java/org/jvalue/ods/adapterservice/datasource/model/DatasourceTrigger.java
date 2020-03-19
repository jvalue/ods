package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;
import java.util.Date;
import java.util.Objects;

@Embeddable
public class DatasourceTrigger {

    private boolean periodic;

    //time of first execution
    @NotNull
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", locale = "UTC")
    private Date firstExecution;

    //execution interval in ms
    private Long interval;


    //Constructor for JPA
    private DatasourceTrigger() {
    }

    @JsonCreator
    public DatasourceTrigger(
            @JsonProperty("periodic") boolean periodic,
            @JsonProperty("firstExecution") Date firstExecution,
            @JsonProperty("interval") Long interval) {
        this.periodic = periodic;
        this.firstExecution = firstExecution;
        this.interval = interval;
    }

    public boolean isPeriodic() {
      return periodic;
    }

    public Date getFirstExecution() {
      return firstExecution;
    }

    public Long getInterval() {
    return interval;
  }

    @Override
    public String toString() {
        return "PipelineTriggerConfig{" +
                "periodic=" + periodic +
                ", firstExecution=" + firstExecution +
                ", interval=" + interval +
                '}';
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (!(o instanceof DatasourceTrigger)) return false;
      DatasourceTrigger that = (DatasourceTrigger) o;
      return periodic == that.periodic &&
        Objects.equals(firstExecution, that.firstExecution) &&
        Objects.equals(interval, that.interval);
    }

    @Override
    public int hashCode() {
      return Objects.hash(periodic, firstExecution, interval);
    }
}
