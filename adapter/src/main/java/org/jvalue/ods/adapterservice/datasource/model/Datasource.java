package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
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
