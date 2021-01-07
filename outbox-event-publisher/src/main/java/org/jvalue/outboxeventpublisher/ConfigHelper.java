package org.jvalue.outboxeventpublisher;

import io.debezium.config.Configuration;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.function.Consumer;

@Slf4j
public class ConfigHelper {
  public static Consumer<Configuration.Builder> fromEnvVar(String prefix) {
    return builder ->
      System.getenv().forEach((key, value) -> {
        var normalizedKey = key.replace("_", ".").toLowerCase();
        if (normalizedKey.startsWith(prefix)) {
          builder.with(normalizedKey.replace(prefix, ""), value);
        }
      });
  }

  public static Configuration fromResource(String name) {
    try (var configStream = OutboxEventPublisher.class.getResourceAsStream(name)) {
      return Configuration.load(configStream);
    } catch (IOException e) {
      log.warn("Failed to load configuration from resource {}", name);
      return Configuration.empty();
    }
  }
}
