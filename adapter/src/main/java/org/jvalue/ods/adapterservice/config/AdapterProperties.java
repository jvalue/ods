package org.jvalue.ods.adapterservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "adapter", ignoreUnknownFields = false)
public class AdapterProperties {
  private Amqp amqp;

  @Getter
  @Setter
  public static class Amqp {
    private String importSuccessTopic;
    private String importFailedTopic;
    private String datasourceCreatedTopic;
    private String datasourceUpdatedTopic;
    private String datasourceDeletedTopic;
    private String adapterExchange;
    private String datasourceImportTriggerQueue;
    private String datasourceImportTriggerQueueTopic;
    private String datasourceImportTriggerCreatedTopic;
  }
}
