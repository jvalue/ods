package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.jvalue.ods.adapterservice.datasource.api.rest.v1.Mappings;

import javax.persistence.*;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

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

  private String health;

  @ElementCollection
  private List<String> errorMessages;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name="datasource_id")
  @JsonIgnore
  private Datasource datasource;

  public DataImport(Datasource datasource, String data) {
    this(datasource, data, "OK", null);
  }

  public DataImport(Datasource datasource, String data, String health) {
    this(datasource, data, health, null);
  }

  public DataImport(Datasource datasource, String data, String health, List<String> errorMessages) {
    this.datasource = datasource;
    this.data = data.getBytes(StandardCharsets.UTF_8);
    this.health = health;
    this.errorMessages = errorMessages;
    this.timestamp = new Date();
  }

  public void setHealth(String health) {
    this.health = health;
  }

  public String getData() {
    return new String(data, StandardCharsets.UTF_8);
  }

  @JsonIgnore
  public MetaData getMetaData() {
    return new MetaData(this.id, this.timestamp, this.health, this.errorMessages, this.datasource);
  }

  // json representation without the actual data (for import list)
  @AllArgsConstructor
  @Getter
  public static class MetaData {
    private final Long id;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", locale = "UTC")
    private final Date timestamp;

    private final String health;

    private final List<String> errorMessages;

    @JsonIgnore
    private final Datasource datasource;

    public String getLocation() {
      return Mappings.DATASOURCE_PATH + "/" + datasource.getId() + Mappings.DATAIMPORT_PATH + "/" + id + Mappings.DATA_PATH;
    }
  }
}
