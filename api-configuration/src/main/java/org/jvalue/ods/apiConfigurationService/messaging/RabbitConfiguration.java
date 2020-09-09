package org.jvalue.ods.apiConfigurationService.messaging;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfiguration {

  public static final String AMPQ_EXCHANGE = "ods_global";
  public static final String AMQP_PIPELINE_CONFIG_CREATED_TOPIC = "pipeline.config.created";
  public static final String  AMQP_PIPELINE_CONFIG_UPDATED_TOPIC = "pipeline.config.updated";
  public static final String AMQP_PIPELINE_CONFIG_DELETED_TOPIC = "pipeline.config.deleted";

  @Bean
  public Exchange eventExchange() {
    return new TopicExchange(AMPQ_EXCHANGE);
  }

  @Bean
  public Queue queue() {
    return new Queue("storage-mq.pipeline-config");
  }

  @Bean
  public Binding binding(Queue queue, Exchange eventExchange) {
    return BindingBuilder.bind(queue).to(eventExchange).with("pipeline.config.*").noargs();
  }

  @Bean
  public RabbitConfiguration eventReceiver() {
    return new RabbitConfiguration();
  }

}

