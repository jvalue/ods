package org.jvalue.ods.adapterservice.model;

import javax.persistence.*;
import java.util.Objects;

@Entity
public class DataBlob {

  @EmbeddedId
  private MetaData metaData;

  private String data;

  public DataBlob() {
  }

  public DataBlob(String data) {
    this.data = data;
  }

  public String getData() {
    return data;
  }

  public MetaData getMetaData() {
    return metaData;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    DataBlob dataBlob = (DataBlob) o;
    return Objects.equals(metaData, dataBlob.metaData) &&
            Objects.equals(data, dataBlob.data);
  }

  @Override
  public int hashCode() {
    return Objects.hash(metaData, data);
  }
}
