package org.jvalue.ods.adapterservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfiguration {
    @Value("${queues.dataImportQueue}")
    public static String DATA_IMPORT_QUEUE;

    @Bean
    public Queue dataImportQueue() {
        return new Queue(DATA_IMPORT_QUEUE);
    }
}
