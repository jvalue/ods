package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jvalue.ods.adapterservice.adapter.Protocol;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.FormatConfig;
import org.jvalue.ods.adapterservice.adapter.model.ProtocolConfig;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@Entity
public class Datasource {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id") // referenced by embedded datasource config for format and protocol
  private Long id;

  @NotNull
  private DatasourceProtocol protocol;

  @NotNull
  private DatasourceFormat format;

  @NotNull
  private DatasourceMetadata metadata;

  @NotNull
  private DatasourceTrigger trigger;

  //Constructor for JPA
  private Datasource() {
  }

  @JsonCreator
  public Datasource(
    @JsonProperty("protocol") DatasourceProtocol protocol,
    @JsonProperty("format") DatasourceFormat format,
    @JsonProperty("metadata") DatasourceMetadata metadata,
    @JsonProperty("trigger") DatasourceTrigger trigger) {
    this.protocol = protocol;
    this.format = format;
    this.metadata = metadata;
    this.trigger = trigger;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public DatasourceProtocol getProtocol() {
    return protocol;
  }

  public DatasourceFormat getFormat() {
    return format;
  }

  public DatasourceMetadata getMetadata() {
    return metadata;
  }

  public DatasourceTrigger getTrigger() {
    return trigger;
  }

  @Override
  public String toString() {
    return "Datasource{" +
      "id=" + id +
      ", protocol=" + protocol +
      ", format=" + format +
      ", metadata=" + metadata +
      ", trigger=" + trigger +
      '}';
  }

  public AdapterConfig toAdapterConfig(RuntimeParameters runtimeParameters) {
    var parameters = fillQueryParameters(runtimeParameters);
    return new AdapterConfig(
      new ProtocolConfig(this.getProtocol().getType(), parameters),
      new FormatConfig(this.getFormat().getType(), this.getFormat().getParameters())
    );
  }

  protected Map<String, Object> fillQueryParameters(RuntimeParameters runtimeParameters) {
    if (!this.getProtocol().getType().equals(Protocol.HTTP)) {
      return this.getProtocol().getParameters();
    }

    Map<String, String> replacementParameters = new HashMap<>();

    //Add all default parameters to the replacement parameters map
    if (this.getProtocol().getParameters().containsKey("defaultParameters")) {
      var defaultParams = (Map<String, String>) this.getProtocol().getParameters().get("defaultParameters");
      defaultParams.forEach(replacementParameters::put);
    }

    //Add all runtime parameters to the replacement parameters map
    if (runtimeParameters != null && runtimeParameters.parameters != null) {
      runtimeParameters.parameters.forEach(replacementParameters::put);
    }

    String url = (String) this.getProtocol().getParameters().get("location");
    for (Map.Entry<String, String> parameter : replacementParameters.entrySet()) {
      url = url.replace("{" + parameter.getKey() + "}", parameter.getValue());
    }

    Map<String, Object> parameters = new HashMap<>(this.getProtocol().getParameters());
    parameters.put("location", url);
    return parameters;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Datasource)) return false;
    Datasource that = (Datasource) o;
    return Objects.equals(id, that.id) &&
      Objects.equals(protocol, that.protocol) &&
      Objects.equals(format, that.format) &&
      Objects.equals(metadata, that.metadata) &&
      Objects.equals(trigger, that.trigger);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, protocol, format, metadata, trigger);
  }
}
