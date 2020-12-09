package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.jvalue.ods.adapterservice.adapter.api.rest.v1.Mappings;

import javax.persistence.*;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Objects;

@Entity
public class DataBlob {

  @Id
  @GeneratedValue
  private Long id;

  private byte[] data;

  public DataBlob() {
  }

  public DataBlob(String data) {
    this.data = data.getBytes(StandardCharsets.UTF_8);
  }

  public String getData() {
    return new String(data, StandardCharsets.UTF_8);
  }

  public Long getId() {
    return id;
  }

  @JsonIgnore
  public MetaData getMetaData() {
    return new MetaData(this);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    DataBlob dataBlob = (DataBlob) o;
    return Objects.equals(id, dataBlob.id) &&
      Arrays.equals(data, dataBlob.data);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, data);
  }

  // json representation without the actual data (as response for adapter trigger)
  public static class MetaData {
    private final Long id;

    public MetaData(DataBlob dataBlob) {
      this.id = dataBlob.id;
    }

    public Long getId() {
      return id;
    }

    public String getLocation() {
      return Mappings.DATA_PATH + "/" + id;
    }
  }
}

