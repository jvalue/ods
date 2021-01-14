package org.jvalue.outboxeventpublisher;

import io.debezium.config.Configuration;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.function.Consumer;

@Slf4j
public class ConfigHelper {
  /**
   * Returns a {@link Configuration.Builder} consumer that adds environment variables to the
   * configuration if they have the given prefix. The prefix will be removed from variable name.
   * '_' in environment variables names will be replaced by '.' and transformed to lower case.
   *
   * @param prefix the prefix of the environment variables to add
   * @return a consumer
   */
  public static Consumer<Configuration.Builder> fromEnvVar(String prefix) {
    return builder ->
      System.getenv().forEach((key, value) -> {
        var dottedKey = key.replace("_", ".").toLowerCase();
        if (dottedKey.startsWith(prefix)) {
          var keyWithoutPrefix = dottedKey.replace(prefix, "");
          builder.with(keyWithoutPrefix, value);
        }
      });
  }

  /**
   * Creates a new {@link Configuration} object from a resource with the given name
   * @param name the name of the resource
   * @return a configuration based on the resource or an empty configuration if resource could not be loaded.
   */
  public static Configuration fromResource(String name) {
    try (var configStream = OutboxEventPublisher.class.getResourceAsStream(name)) {
      return Configuration.load(configStream);
    } catch (IOException e) {
      log.warn("Failed to load configuration from resource {}", name);
      return Configuration.empty();
    }
  }
}
