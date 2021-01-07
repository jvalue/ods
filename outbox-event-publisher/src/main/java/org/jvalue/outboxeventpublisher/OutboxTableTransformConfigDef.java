package org.jvalue.outboxeventpublisher;

import io.debezium.config.Field;
import org.apache.kafka.common.config.ConfigDef;

public class OutboxTableTransformConfigDef {
  static final Field FIELD_EVENT_ID = Field.create("table.field.event.id")
    .withDisplayName("Event ID Field")
    .withType(ConfigDef.Type.STRING)
    .withDefault("id")
    .withDescription("The column which contains the event ID within the outbox table");

  static final Field FIELD_EVENT_TOPIC = Field.create("table.field.event.topic")
    .withDisplayName("Event topic Field")
    .withType(ConfigDef.Type.STRING)
    .withDefault("topic")
    .withDescription("The column which contains the event topic within the outbox table");

  static final Field FIELD_EVENT_PAYLOAD = Field.create("table.field.event.payload")
    .withDisplayName("Event payload Field")
    .withType(ConfigDef.Type.STRING)
    .withDefault("payload")
    .withDescription("The column which contains the event payload within the outbox table");

  static ConfigDef get() {
    var configDef = new ConfigDef();
    Field.group(configDef, "table", FIELD_EVENT_ID, FIELD_EVENT_TOPIC, FIELD_EVENT_PAYLOAD);
    return configDef;
  }
}
