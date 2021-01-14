package org.jvalue.outboxeventpublisher;

import io.debezium.config.Configuration;
import io.debezium.data.Envelope;
import io.debezium.transforms.SmtManager;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.config.ConfigDef;
import org.apache.kafka.connect.connector.ConnectRecord;
import org.apache.kafka.connect.errors.ConnectException;
import org.apache.kafka.connect.transforms.ExtractField;
import org.apache.kafka.connect.transforms.Transformation;

import java.util.Map;

import static org.apache.kafka.connect.transforms.util.Requirements.requireStruct;

/**
 * This transformation extracts the unique event id, the routing key, and the payload from the raw change records.
 * Delete and update change events will be discarded, because once an event is published (e.g. added
 * to the outbox table) it should neither be changed nor deleted.
 */
@Slf4j
public class OutboxTableTransform<R extends ConnectRecord<R>> implements Transformation<R> {
  private final ExtractField<R> afterFieldExtractor = new ExtractField.Value<>();

  private String fieldEventId;
  private String fieldEventRoutingKey;
  private String fieldEventPayload;

  private SmtManager<R> smtManager;

  @Override
  public R apply(R record) {
    if (isIgnoredRecord(record)) {
      return null;
    }

    var afterRecord = afterFieldExtractor.apply(record);
    var eventStruct = requireStruct(afterRecord.value(), "Read Outbox Event");
    var eventValueSchema = afterRecord.valueSchema();

    var idField = eventValueSchema.field(fieldEventId);
    if (idField == null) {
      throw new ConnectException(String.format("Unable to find ID field %s in event", fieldEventId));
    }

    var routingKeyField = eventValueSchema.field(fieldEventRoutingKey);
    if (routingKeyField == null) {
      throw new ConnectException(String.format("Unable to find routing_key field %s in event", fieldEventRoutingKey));
    }

    var payloadField = eventValueSchema.field(fieldEventPayload);
    if (payloadField == null) {
      throw new ConnectException(String.format("Unable to find payload field %s in event", fieldEventPayload));
    }

    var id = eventStruct.get(fieldEventId);
    var routingKey = eventStruct.getString(fieldEventRoutingKey);
    var payload = eventStruct.get(fieldEventPayload);

    return record.newRecord(routingKey, null, idField.schema(), id, payloadField.schema(), payload, null);
  }

  @Override
  public ConfigDef config() {
    return OutboxTableTransformConfigDef.get();
  }

  @Override
  public void close() {

  }

  @Override
  public void configure(Map<String, ?> configMap) {
    var config = Configuration.from(configMap);

    fieldEventId = config.getString(OutboxTableTransformConfigDef.FIELD_EVENT_ID);
    fieldEventRoutingKey = config.getString(OutboxTableTransformConfigDef.FIELD_EVENT_ROUTING_KEY);
    fieldEventPayload = config.getString(OutboxTableTransformConfigDef.FIELD_EVENT_PAYLOAD);

    smtManager = new SmtManager<>(config);

    afterFieldExtractor.configure(Map.of("field", Envelope.FieldName.AFTER));
  }

  private boolean isIgnoredRecord(R record) {
    var isTombstoneEvent = record.value() == null;
    if (isTombstoneEvent) {
      log.debug("Ignoring tombstone event with key: {}", record.key());
      return true;
    }

    // Ignoring events not matching the CDC envelope (e.g. heartbeat and schema change events)
    if (!smtManager.isValidEnvelope(record)) {
      log.debug("Ignoring non CDC event with key: {}", record.key());
      return true;
    }

    var debeziumEventValue = requireStruct(record.value(), "Detect Debezium Operation");
    var operation = Envelope.Operation.forCode(debeziumEventValue.getString(Envelope.FieldName.OPERATION));

    var isIgnoredOperation = switch (operation) {
      case DELETE, UPDATE -> true;
      default -> false;
    };
    if (isIgnoredOperation) {
      log.warn("Ignoring {} event with key: {}", operation, record.key());
      return true;
    }

    return false;
  }
}
