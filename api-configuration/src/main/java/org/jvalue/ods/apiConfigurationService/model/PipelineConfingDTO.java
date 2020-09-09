package org.jvalue.ods.apiConfigurationService.model;

public class PipelineConfingDTO {

  private String pipelineId;
  private String pipelineName;
  private boolean defaultAPI;

  public PipelineConfingDTO(String pipelineId, String pipelineName, boolean defaultAPI) {
    this.pipelineId = pipelineId;
    this.pipelineName = pipelineName;
    this.defaultAPI = defaultAPI;
  }

  public PipelineConfingDTO(){ }

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
      '}';
  }
}
