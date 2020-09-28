package org.jvalue.ods.apiConfigurationService.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Embeddable;
import java.io.Serializable;
import java.util.Date;
import java.util.Objects;

//@Embeddable

public class RemoteSchemaData implements Serializable {

  private Long id;
  private String endpoint;
  private String author;


  public RemoteSchemaData() { }

  @JsonCreator
  public RemoteSchemaData(
    @JsonProperty("id") Long id,
    @JsonProperty("endpoint") String endpoint,
    @JsonProperty("author") String author)
    {
    this.id = id;
    this.endpoint = endpoint;
    this.author = author;
  }


//    public RemoteSchemaData(int id, String endpoint, String author) {
//      this.id = id;
//      this.endpoint = endpoint;
//      this.author = author;
//    }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    RemoteSchemaData that = (RemoteSchemaData) o;
    return Objects.equals(id, that.id) &&
      Objects.equals(endpoint, that.endpoint) &&
      Objects.equals(author, that.author);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, endpoint, author);
  }

  @Override
  public String toString() {
    return "RemoteSchemaData{" +
      "id=" + id +
      ", endpoint='" + endpoint + '\'' +
      ", author='" + author + '\'' +
      '}';
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getEndpoint() {
    return endpoint;
  }

  public void setEndpoint(String endpoint) {
    this.endpoint = endpoint;
  }

  public String getAuthor() {
    return author;
  }

  public void setAuthor(String author) {
    this.author = author;
  }
}
