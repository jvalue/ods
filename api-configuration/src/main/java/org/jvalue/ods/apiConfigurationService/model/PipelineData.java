package org.jvalue.ods.apiConfigurationService.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonRawValue;
import org.json.JSONArray;
import org.json.JSONObject;

public class PipelineData {


  private int id;
  @JsonProperty(value="data")
  private Object data;
  private String timestamp;


  public int getId() {
    return id;
  }

  public void setId(int id) {
    this.id = id;
  }

  public Object getData() {
    return data;
  }

  public void setData(Object data) {
    this.data = data;
  }

  public String getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(String timestamp) {
    this.timestamp = timestamp;
  }

  @Override
  public String toString() {
    return "PipelineData{" +
      "id=" + id +
      ", data='" + data + '\'' +
      ", timestamp='" + timestamp + '\'' +
      '}';
  }
}
