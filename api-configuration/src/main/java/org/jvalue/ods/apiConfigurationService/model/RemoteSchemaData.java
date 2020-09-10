package org.jvalue.ods.apiConfigurationService.model;

public class RemoteSchemaData{

  private int id;
  private String endpoint;
  private String author;

  public RemoteSchemaData() { }

//    public RemoteSchemaData(int id, String endpoint, String author) {
//      this.id = id;
//      this.endpoint = endpoint;
//      this.author = author;
//    }

  @Override
  public String toString() {
    return "RemoteSchemaData{" +
      "id=" + id +
      ", endpoint='" + endpoint + '\'' +
      ", author='" + author + '\'' +
      '}';
  }

  public int getId() {
    return id;
  }

  public void setId(int id) {
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
