package org.jvalue.ods.apiConfigurationService.model;

public class PipelineConfigDTO {

  private String pipelineId;
  private String pipelineName;
  private boolean defaultAPI;
  private RemoteSchemaData[] remoteSchemata;

//  public PipelineConfigDTO(String pipelineId, String pipelineName, boolean defaultAPI, RemoteSchemaData[] remoteSchemata) {
//    this.pipelineId = pipelineId;
//    this.pipelineName = pipelineName;
//    this.defaultAPI = defaultAPI;
//    this.remoteSchemata = remoteSchemata;
//  }

  public PipelineConfigDTO(){ }

  public String getPipelineId() {
    return pipelineId;
  }

  public void setPipelineId(String pipelineId) {
    this.pipelineId = pipelineId;
  }

  public String getPipelineName() {
    return pipelineName;
  }

  public void setPipelineName(String pipelineName) {
    this.pipelineName = pipelineName;
  }

  public boolean getDefaultAPI() {
    return defaultAPI;
  }

  public void setDefaultAPI(boolean defaultAPI) {
    this.defaultAPI = defaultAPI;
  }

  @Override
  public String toString() {
    return "PipelineConfingDTO{" +
      "pipelineId='" + pipelineId + '\'' +
      ", pipelineName='" + pipelineName + '\'' +
      ", defaultAPI='" + defaultAPI + '\'' +
      ", remoteSchemata='" + remoteSchemata.toString() + '\'' +
      '}';
  }

  public RemoteSchemaData[] getRemoteSchemata() {
    return remoteSchemata;
  }

  public void setRemoteSchemata(RemoteSchemaData[] remoteSchemata) {
    this.remoteSchemata = remoteSchemata;
  }

}
