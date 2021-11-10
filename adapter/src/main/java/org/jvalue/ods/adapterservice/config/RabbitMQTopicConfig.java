package org.jvalue.ods.adapterservice.config;

import lombok.AllArgsConstructor;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@AllArgsConstructor
public class RabbitMQTopicConfig {
  private final AdapterProperties properties;

	@Bean
	Queue datasourceImportTriggerQueue() {
		return new Queue(properties.getAmqp().getDatasourceImportTriggerQueue(), false);
	}

	@Bean
	TopicExchange topicExchange() {
		return new TopicExchange(properties.getAmqp().getAdapterExchange());
	}

	@Bean
	Binding allBinding(Queue datasourceImportTriggerQueue, TopicExchange topicExchange) {
		return BindingBuilder.bind(datasourceImportTriggerQueue).to(topicExchange).with(properties.getAmqp().getDatasourceImportTriggerQueueTopic());
	}

  @Bean
  public SimpleRabbitListenerContainerFactory containerFactory(ConnectionFactory connectionFactory) {
    SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
    factory.setConnectionFactory(connectionFactory);
    factory.setMessageConverter(producerJackson2MessageConverter());
    return factory;
  }

  @Bean
  public Jackson2JsonMessageConverter producerJackson2MessageConverter() {
    return new Jackson2JsonMessageConverter();
  }

}
