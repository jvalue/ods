package org.jvalue.ods.adapterservice.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfiguration {

    public static final String AMPQ_EXCHANGE = System.getenv("AMQP_EXCHANGE");
    public static final String AMQP_IMPORT_SUCCESS_TOPIC = System.getenv("AMQP_IMPORT_SUCCESS_TOPIC");
    public static final String AMQP_IMPORT_FAILED_TOPIC = System.getenv("AMQP_IMPORT_FAILED_TOPIC");

    @Bean
    public TopicExchange odsExchange() {
        return new TopicExchange(AMPQ_EXCHANGE);
    }
}
