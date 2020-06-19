package org.jvalue.ods.adapterservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfiguration {
    @Bean
    public Queue dataImportQueue() {
        return new Queue("dataImportQueue");
    }
}
