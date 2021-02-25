package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;
import java.util.Date;

@Embeddable
@Getter
@Setter
@ToString
@NoArgsConstructor
@EqualsAndHashCode
public class DatasourceTrigger {

  private boolean periodic;

  //time of first execution
  @NotNull
  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", locale = "UTC")
  private Date firstExecution;

  //execution interval in ms
  private Long interval;

  @JsonCreator
  public DatasourceTrigger(
    @JsonProperty("periodic") boolean periodic,
    @JsonProperty("firstExecution") Date firstExecution,
    @JsonProperty("interval") Long interval) {
    this.periodic = periodic;
    this.firstExecution = firstExecution;
    this.interval = interval;
  }
}
