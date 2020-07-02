package org.jvalue.ods.adapterservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static java.lang.System.getenv;

@Configuration
public class RabbitConfiguration {
    public static final String DATA_IMPORT_QUEUE = "data_import";

    @Bean
    public Queue dataImportQueue() {
        return new Queue(DATA_IMPORT_QUEUE);
    }

  @Bean
  public Queue adapterConfigQueue() {
    return new Queue(getenv("AMQP_ADAPTER_CONFIG_CHANNEL"));
  }
}
