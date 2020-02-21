package org.jvalue.ods.adapterservice.model;

import javax.persistence.*;

@Entity
public class DataBlob {

  @Id
  @GeneratedValue
  private Long id;

  private Object data;

  public DataBlob() {
  }

  public DataBlob(Object data) {
    this.data = data;
  }

  public Long getId() {
    return id;
  }
}
