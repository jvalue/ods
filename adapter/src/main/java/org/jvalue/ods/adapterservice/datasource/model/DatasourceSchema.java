package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;

@Embeddable
@Getter
@Setter
@ToString
@NoArgsConstructor
@EqualsAndHashCode
public class DatasourceSchema {

  @NotNull
  private String data;

  @JsonCreator
  public DatasourceSchema(
    @JsonProperty("data") String data) {
    this.data = data;
  }
}
