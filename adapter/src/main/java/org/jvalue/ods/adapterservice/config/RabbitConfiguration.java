package org.jvalue.ods.adapterservice.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfiguration {
  private static final Logger log = LoggerFactory.getLogger(RabbitConfiguration.class);
  private final AdapterProperties.Amqp amqpConfig;

  public RabbitConfiguration(AdapterProperties adapterProperties) {
    this.amqpConfig = adapterProperties.getAmqp();
  }

  @Bean
  public TopicExchange exchange() {
    return new TopicExchange(amqpConfig.getExchange());
  }

  @Bean
  public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
    RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory) {
      @Override
      public void convertAndSend(String exchange, String routingKey, Object object) throws AmqpException {
        super.convertAndSend(exchange, routingKey, object);
        log.debug("Publishing event " + routingKey + ": " + object.toString());
      }
    };
    rabbitTemplate.setMessageConverter(jackson2JsonConverter());
    return rabbitTemplate;
  }

  @Bean
  public Jackson2JsonMessageConverter jackson2JsonConverter() {
    return new Jackson2JsonMessageConverter();
  }

}
