package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.jvalue.ods.adapterservice.datasource.api.rest.v1.Mappings;

import javax.persistence.*;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Entity
@NoArgsConstructor
@EqualsAndHashCode
@Getter
public class DataImport {

  @Id
  @GeneratedValue
  private Long id;

  private byte[] data;
  
  private Date timestamp;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name="datasource_id")
  @JsonIgnore
  private Datasource datasource;

  public DataImport(Datasource datasource, String data) {
    this.datasource = datasource;
    this.data = data.getBytes(StandardCharsets.UTF_8);
    this.timestamp = new Date();
  }

  public String getData() {
    return new String(data, StandardCharsets.UTF_8);
  }

  @JsonIgnore
  public MetaData getMetaData() {
    return new MetaData(this.id, this.timestamp, this.datasource);
  }

  // json representation without the actual data (for import list)
  @AllArgsConstructor
  @Getter
  public static class MetaData {
    private final Long id;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", locale = "UTC")
    private final Date timestamp;
    @JsonIgnore
    private final Datasource datasource;

    public String getLocation() {
      return Mappings.DATASOURCE_PATH + "/" + datasource.getId() + Mappings.DATAIMPORT_PATH + "/" + id + Mappings.DATA_PATH;
    }
  }
}
