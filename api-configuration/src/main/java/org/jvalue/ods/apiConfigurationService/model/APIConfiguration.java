package org.jvalue.ods.apiConfigurationService.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;


import javax.persistence.Id;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.validation.constraints.NotNull;
import java.util.Arrays;
import java.util.Objects;

@Entity
public class APIConfiguration {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id") // referenced by embedded datasource config for format and protocol
  private Long id;

  @NotNull
  private Long pipelineId;
  @NotNull
  private String displayName;
  @NotNull
  private boolean defaultAPI;

  private RemoteSchemaData[] remoteSchemata;

//  public PipelineConfigDTO(String pipelineId, String pipelineName, boolean defaultAPI, RemoteSchemaData[] remoteSchemata) {
//    this.pipelineId = pipelineId;
//    this.pipelineName = pipelineName;
//    this.defaultAPI = defaultAPI;
//    this.remoteSchemata = remoteSchemata;
//  }
  @JsonCreator
  public APIConfiguration(
    @JsonProperty("id") Long id,
    @JsonProperty("pipelineId") Long pipelineId,
    @JsonProperty("displayName") String displayName,
    @JsonProperty("defaultAPI") boolean defaultAPI,
    @JsonProperty("remoteSchemata") RemoteSchemaData[] remoteSchemata) {
    this.id = id;
    this.pipelineId = pipelineId;
    this.displayName = displayName;
    this.defaultAPI = defaultAPI;
    this.remoteSchemata = remoteSchemata;
  }

  public APIConfiguration(){ }

    public Long getPipelineId() {
      return pipelineId;
    }

    public void setPipelineId(Long pipelineId) {
      this.pipelineId = pipelineId;
    }

    public boolean getDefaultAPI() {
      return defaultAPI;
    }

    public void setDefaultAPI(boolean defaultAPI) {
      this.defaultAPI = defaultAPI;
    }

  public RemoteSchemaData[] getRemoteSchemata() {
      return remoteSchemata;
    }

    public void setRemoteSchemata(RemoteSchemaData[] remoteSchemata) {
      this.remoteSchemata = remoteSchemata;
    }

  public String getDisplayName() {
    return displayName;
  }

  public void setDisplayName(String displayName) {
    this.displayName = displayName;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  @Override
  public String toString() {
    return "APIConfiguration{" +
      "id='" + id + '\'' +
      ", pipelineId='" + pipelineId + '\'' +
      ", displayName='" + displayName + '\'' +
      ", defaultAPI=" + defaultAPI +
      ", remoteSchemata=" + Arrays.toString(remoteSchemata) +
      '}';
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    APIConfiguration that = (APIConfiguration) o;
    return defaultAPI == that.defaultAPI &&
      Objects.equals(id, that.id) &&
      Objects.equals(pipelineId, that.pipelineId) &&
      Objects.equals(displayName, that.displayName) &&
      Arrays.equals(remoteSchemata, that.remoteSchemata);
  }

  @Override
  public int hashCode() {
    int result = Objects.hash(id, pipelineId, displayName, defaultAPI);
    result = 31 * result + Arrays.hashCode(remoteSchemata);
    return result;
  }
}

