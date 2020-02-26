package org.jvalue.ods.adapterservice.model;

import javax.persistence.*;

@Entity
public class DataBlob {

  @Id
  @GeneratedValue
  private Long id;

  private String data;

  public DataBlob() {
  }

  public DataBlob(String data) {
    this.data = data;
  }

  public Long getId() {
    return id;
  }

  public String getData() {
    return data;
  }
}
