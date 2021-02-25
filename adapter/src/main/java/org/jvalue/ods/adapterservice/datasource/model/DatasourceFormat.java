package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.jvalue.ods.adapterservice.adapter.Format;
import org.jvalue.ods.adapterservice.datasource.repository.GenericParameterConverter;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Map;

@Embeddable
@Getter
@Setter
@ToString
@NoArgsConstructor
@EqualsAndHashCode
public class DatasourceFormat {

  @NotNull
  @Column(name = "format_type")
  @Enumerated(EnumType.STRING)
  private Format type;

  @NotNull
  @Column(name = "format_parameters")
  @Convert(converter = GenericParameterConverter.class)
  private Map<String, Object> parameters;

  @JsonCreator
  public DatasourceFormat(@JsonProperty("type") Format type,
                          @JsonProperty("parameters") Map<String, Object> parameters) {
    this.type = type;
    this.parameters = parameters;
  }
}
