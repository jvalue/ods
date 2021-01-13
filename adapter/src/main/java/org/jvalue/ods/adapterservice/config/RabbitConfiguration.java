package org.jvalue.ods.adapterservice.config;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@AllArgsConstructor
@Configuration
public class RabbitConfiguration {
  private final AdapterProperties properties;

  @Bean
  public TopicExchange exchange() {
    return new TopicExchange(properties.getAmqp().getExchange());
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
