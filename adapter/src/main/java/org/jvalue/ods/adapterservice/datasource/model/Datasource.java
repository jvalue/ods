package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.FormatConfig;
import org.jvalue.ods.adapterservice.adapter.model.ProtocolConfig;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collector;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
      DatasourceProtocol datasourceProtocol = fillQueryParameters(runtimeParameters);
      return new AdapterConfig(
        new ProtocolConfig(this.getProtocol().getType(), datasourceProtocol.getParameters()),
        new FormatConfig(this.getFormat().getType(), this.getFormat().getParameters())
      );
  }

    protected DatasourceProtocol fillQueryParameters(RuntimeParameters runtimeParameters) {
      if (!this.getProtocol().getType().equals("HTTP")) {
        return this.getProtocol();
      }
      String url = (String) this.getProtocol().getParameters().get("location");
      Map<String, String> defaultParameters = new HashMap<>();
      if (this.getProtocol().getParameters().containsKey("defaultParameters")) {
        defaultParameters = (Map<String, String>) this.getProtocol().getParameters().get("defaultParameters");
      }
      Map<String, String> triggerParameters = new HashMap<>();
      if (runtimeParameters != null && runtimeParameters.parameters != null) {
        triggerParameters = runtimeParameters.parameters;
      }
      Map<String, String> replacementParameters = Stream.of(defaultParameters, triggerParameters).flatMap(map -> map.entrySet().stream()).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (v1, v2) -> v2));
      for (Map.Entry<String, String> parameter : replacementParameters.entrySet()) {
        url = url.replace("{" + parameter.getKey() + "}", parameter.getValue());
      }
      HashMap<String, Object> parameters = new HashMap<>(this.getProtocol().getParameters());
      parameters.put("location", url);
      return new DatasourceProtocol(this.getProtocol().getType(), parameters);
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
