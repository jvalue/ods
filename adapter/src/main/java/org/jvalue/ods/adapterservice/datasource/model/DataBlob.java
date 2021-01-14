package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.jvalue.ods.adapterservice.datasource.api.rest.v1.Mappings;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import java.nio.charset.StandardCharsets;

@Entity
@ToString
@NoArgsConstructor
@EqualsAndHashCode
public class DataBlob {

  @Id
  @GeneratedValue
  private Long id;

  private byte[] data;

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
    return new MetaData(id);
  }

  // json representation without the actual data (as response for adapter trigger)
  @AllArgsConstructor
  @Getter
  public static class MetaData {
    private final Long id;

    public String getLocation() {
      return Mappings.DATA_PATH + "/" + id;
    }
  }
}

