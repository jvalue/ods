package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.jvalue.ods.adapterservice.adapter.Protocol;
import org.jvalue.ods.adapterservice.datasource.repository.GenericParameterConverter;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@ToString
@NoArgsConstructor
@EqualsAndHashCode
public class DatasourceProtocol {

  @NotNull
  @Column(name = "protocol_type")
  @Enumerated(EnumType.STRING)
  private Protocol type;

  @NotNull
  @Column(name = "protocol_parameters")
  @Lob // tells JPA to make the field a BLOB, which results in using the TEXT column type in PostgreSQL
  @Convert(converter = GenericParameterConverter.class)
  private Map<String, Object> parameters;

  @JsonCreator
  public DatasourceProtocol(@JsonProperty("type") Protocol type,
                            @JsonProperty("parameters") Map<String, Object> parameters) {
    this.type = type;
    this.parameters = parameters;
  }
}
