package org.jvalue.outboxeventpublisher;

import io.debezium.config.Field;
import org.apache.kafka.common.config.ConfigDef;

/**
 * This class contains the configuration definition for the {@link OutboxTableTransform}.
 */
public class OutboxTableTransformConfigDef {
  static final Field FIELD_EVENT_ID = Field.create("table.field.event.id")
    .withDisplayName("Event ID field")
    .withType(ConfigDef.Type.STRING)
    .withDefault("id")
    .withDescription("The column which contains the event ID within the outbox table");

  static final Field FIELD_EVENT_ROUTING_KEY = Field.create("table.field.event.routing_key")
    .withDisplayName("Event routing key field")
    .withType(ConfigDef.Type.STRING)
    .withDefault("routing_key")
    .withDescription("The column which contains the event routing key within the outbox table");

  static final Field FIELD_EVENT_PAYLOAD = Field.create("table.field.event.payload")
    .withDisplayName("Event payload field")
    .withType(ConfigDef.Type.STRING)
    .withDefault("payload")
    .withDescription("The column which contains the event payload within the outbox table");

  static ConfigDef get() {
    var configDef = new ConfigDef();
    Field.group(configDef, "table", FIELD_EVENT_ID, FIELD_EVENT_ROUTING_KEY, FIELD_EVENT_PAYLOAD);
    return configDef;
  }
}
