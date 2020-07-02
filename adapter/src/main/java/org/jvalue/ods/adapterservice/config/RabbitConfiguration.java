package org.jvalue.ods.adapterservice.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static java.lang.System.getenv;

@Configuration
public class RabbitConfiguration {
    public static final String DATA_IMPORT_QUEUE = "data_import";
    public static final String DATA_CONFIG_QUEUE = getenv("AMQP_ADAPTER_CONFIG_CHANNEL");

    @Bean
    public Queue dataImportQueue() {
        return new Queue(DATA_IMPORT_QUEUE, true);
    }

  @Bean
  public Queue adapterConfigQueue() {
    return new Queue(DATA_CONFIG_QUEUE, true);
  }
}
