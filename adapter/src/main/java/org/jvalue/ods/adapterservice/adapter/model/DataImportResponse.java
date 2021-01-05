package org.jvalue.ods.adapterservice.adapter.model;

import java.util.Objects;

public class DataImportResponse {
  private final String data;

  public DataImportResponse(String data) {
    this.data = data;
  }

  public String getData() {
    return data;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    DataImportResponse that = (DataImportResponse) o;
    return Objects.equals(data, that.data);
  }

  @Override
  public int hashCode() {
    return Objects.hash(data);
  }

  @Override
  public String toString() {
    return "DataImportResponse{" +
      "data='" + data + '\'' +
      '}';
  }
}
