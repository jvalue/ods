package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jvalue.ods.adapterservice.adapter.Protocol;
import org.jvalue.ods.adapterservice.datasource.repository.GenericParameterConverter;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.Objects;

@Embeddable
public class DatasourceProtocol {

  @NotNull
  @Column(name = "protocol_type")
  @Enumerated(EnumType.STRING)
  private Protocol type;

  @NotNull
  @Column(name = "protocol_parameters", length = 2000)
  @Convert(converter = GenericParameterConverter.class)
  private Map<String, Object> parameters;

  // Constructor for JPA
  private DatasourceProtocol() {
  }

  @JsonCreator
  public DatasourceProtocol(@JsonProperty("type") Protocol type,
                            @JsonProperty("parameters") Map<String, Object> parameters) {
    this.type = type;
    this.parameters = parameters;
  }

  public Protocol getType() {
    return type;
  }

  public Map<String, Object> getParameters() {
    return parameters;
  }

  @Override
  public String toString() {
    return "AdapterProtocolConfig {" + "type='" + type + '\'' + ", parameters='" + parameters + '\'' + '}';
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    DatasourceProtocol config = (DatasourceProtocol) o;
    return type.equals(config.type) && parameters.equals(config.parameters);
  }

  @Override
  public int hashCode() {
    return Objects.hash(type, parameters);
  }
}
