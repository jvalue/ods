package org.jvalue.ods.adapterservice.config;

import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfiguration {

    public static final String AMPQ_EXCHANGE = System.getenv("AMQP_EXCHANGE");
    public static final String AMQP_IMPORT_SUCCESS_TOPIC = System.getenv("AMQP_IMPORT_SUCCESS_TOPIC");
    public static final String AMQP_IMPORT_FAILED_TOPIC = System.getenv("AMQP_IMPORT_FAILED_TOPIC");

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(AMPQ_EXCHANGE);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory) {
            @Override
            public void convertAndSend(String exchange, String routingKey, Object object) throws AmqpException {
                super.convertAndSend(exchange, routingKey, object);
                System.out.println("Published event " + object.toString() + " on exchange " + exchange + " under topic: " + routingKey);
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
