package org.jvalue.ods.adapterservice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
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

  public DataBlob(byte[] data) {
    this.data = data;
  }

  public byte[] getData() {
    return data;
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
  }
}

