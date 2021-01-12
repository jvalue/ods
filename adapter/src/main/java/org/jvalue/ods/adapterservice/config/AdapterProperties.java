package org.jvalue.ods.adapterservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "adapter", ignoreUnknownFields = false)
public class AdapterProperties {

  private Amqp amqp;

  public Amqp getAmqp() {
    return amqp;
  }

  public void setAmqp(Amqp amqp) {
    this.amqp = amqp;
  }

  public static class Amqp {
    private String exchange;
    private String importSuccessTopic;
    private String importFailedTopic;
    private String datasourceCreatedTopic;
    private String datasourceUpdatedTopic;
    private String datasourceDeletedTopic;

    private int publishRetries;
    private long publishBackoff;

    public String getExchange() {
      return exchange;
    }

    public void setExchange(String exchange) {
      this.exchange = exchange;
    }

    public String getImportSuccessTopic() {
      return importSuccessTopic;
    }

    public void setImportSuccessTopic(String importSuccessTopic) {
      this.importSuccessTopic = importSuccessTopic;
    }

    public String getImportFailedTopic() {
      return importFailedTopic;
    }

    public void setImportFailedTopic(String importFailedTopic) {
      this.importFailedTopic = importFailedTopic;
    }

    public String getDatasourceCreatedTopic() {
      return datasourceCreatedTopic;
    }

    public void setDatasourceCreatedTopic(String datasourceCreatedTopic) {
      this.datasourceCreatedTopic = datasourceCreatedTopic;
    }

    public String getDatasourceUpdatedTopic() {
      return datasourceUpdatedTopic;
    }

    public void setDatasourceUpdatedTopic(String datasourceUpdatedTopic) {
      this.datasourceUpdatedTopic = datasourceUpdatedTopic;
    }

    public String getDatasourceDeletedTopic() {
      return datasourceDeletedTopic;
    }

    public void setDatasourceDeletedTopic(String datasourceDeletedTopic) {
      this.datasourceDeletedTopic = datasourceDeletedTopic;
    }

    public int getPublishRetries() {
      return publishRetries;
    }

    public void setPublishRetries(int publishRetries) {
      this.publishRetries = publishRetries;
    }

    public long getPublishBackoff() {
      return publishBackoff;
    }

    public void setPublishBackoff(long publishBackoff) {
      this.publishBackoff = publishBackoff;
    }
  }
}
