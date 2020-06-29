package org.jvalue.ods.adapterservice.adapter.model;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.Serializable;

/**
 * This Event will be sent to the transformation service after data import execution.
 */
public class AdapterEvent implements Serializable {
    private String data;
    private String dataLocation;
    private long datasourceId;

  /**
   * Default constructor
   * @param datasourceId Adapter config identifier (referenced by pipeline config)
   * @param data imported data (by adapter import)
   * @param dataLocation location of the data on adapter service (--> endpoint)
   */
    public AdapterEvent(long datasourceId, String data, String dataLocation) {
      this.datasourceId = datasourceId;
      this.data = data;
      this.dataLocation = dataLocation;
    }

  /**
   * Getter for adapter data
   * @return adapter data
   */
  public String getData() {
      return data;
    }

  /**
   * Setter for adapter data
   * @param data adapter data
   */
  public void setData(String data) {
      this.data = data;
    }

  /**
   * Getter for location of the imported data (adapter endpoint)
   * @return location string (adapter endpoint)
   */
  public String getDataLocation() {
      return dataLocation;
    }

  /**
   * Getter for the datasource id
   * (referenced by pipeline config on transformation service)
   *
    * @return datasource id
   */
  public long getDatasourceId() {
    return datasourceId;
  }

  /**
   * Setter for the datasource id
   * (referenced by pipeline config on transformation service).
   *
   * @param datasourceId
   */
  public void setDatasourceId(long datasourceId) {
    this.datasourceId = datasourceId;
  }
  /**
   * Setter for location of the imported data (adapter endpoint)
   * @param dataLocation location string (adapter endpoint)
   */
  public void setDataLocation(String dataLocation) {
      this.dataLocation = dataLocation;
    }

  /**
   * Converts this class object into a serialized JSON String
   * @return this class object as JSON String
   */
  public String toJSON(){
      ObjectMapper mapper = new ObjectMapper();
      try {
        return mapper.writeValueAsString(this);

      } catch (JsonProcessingException e) {
        e.printStackTrace();
      }
      return null;
    }


}
