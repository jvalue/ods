package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.*;
import javax.validation.constraints.NotNull;

import java.util.Map;
import java.util.Objects;

@Embeddable
public class AdapterFormatConfig {

  @NotNull
  @Column(name = "format_type")
  private String type;

  @NotNull
  @ElementCollection
  @CollectionTable(name = "adapter_format_parameter_mapping",
          joinColumns = {@JoinColumn(name = "pipelineconfig_id", referencedColumnName = "id")})
  @MapKeyColumn(name = "parameter_name")
  @Column(name = "value")
  private Map<String, String> parameters;

  // Constructor for JPA
  private AdapterFormatConfig() {
  }

  @JsonCreator
  public AdapterFormatConfig(@JsonProperty("type") String type,
      @JsonProperty("parameters") Map<String, String> parameters) {
    this.type = type;
    this.parameters = parameters;
  }

  public String getType() {
    return type;
  }

  public Map<String, String> getParameters() {
    return parameters;
  }

  @Override
  public String toString() {
    return "AdapterFormatConfig {" + "type='" + type + '\'' + ", parameters='" + parameters + '\'' + '}';
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    AdapterFormatConfig config = (AdapterFormatConfig) o;
    return type.equals(config.type) && parameters.equals(config.parameters);
  }

  @Override
  public int hashCode() {
    return Objects.hash(type, parameters);
  }
}
