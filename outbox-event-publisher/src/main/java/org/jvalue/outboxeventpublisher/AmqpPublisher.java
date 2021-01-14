package org.jvalue.outboxeventpublisher;

import io.debezium.config.Configuration;
import io.debezium.engine.DebeziumEngine;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.connect.source.SourceRecord;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.io.Closeable;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * This class is a {@link io.debezium.engine.DebeziumEngine.ChangeConsumer} that publishes
 * the events via AMQP. It will get called by the debezium engine to handle the change records.
 *
 * This implementation requires a specific format of the change records, which can be created by
 * the {@link OutboxTableTransform}:
 * <ul>
 *   <li>The record's topic will be the AMQP routing key</li>
 *   <li>The record's key is the unique event id and will be the AMQP message id</li>
 *   <li>The record's value is the event payload and will be the AMQP message body</li>
 * </ul>
 */
@Slf4j
public class AmqpPublisher implements DebeziumEngine.ChangeConsumer<SourceRecord>, Closeable {
  private static final String AMQP_URL_CONFIG_NAME = "amqp.url";
  private static final String AMQP_EXCHANGE_CONFIG_NAME = "amqp.exchange";

  private CachingConnectionFactory connectionFactory;
  private AmqpTemplate template;
  private String exchange;

  public void init(Configuration config) {
    this.exchange = config.getString(AMQP_EXCHANGE_CONFIG_NAME);
    this.connectionFactory = new CachingConnectionFactory(URI.create(config.getString(AMQP_URL_CONFIG_NAME)));
    this.template = new RabbitTemplate(connectionFactory);
  }

  @Override
  public void handleBatch(List<SourceRecord> records, DebeziumEngine.RecordCommitter<SourceRecord> committer) throws InterruptedException {
    for (var record : records) {
      publishEvent(record);
      committer.markProcessed(record);
    }
    committer.markBatchFinished();
  }

  private void publishEvent(SourceRecord record) {
    var routingKey = record.topic();
    var eventId = (String) record.key();
    var payload = (String) record.value();

    log.info("Publishing event {} with routingKey {}", eventId, routingKey);

    var message = createAmqpMessage(eventId, payload);
    // If the message could not be send to amqp, it is important that always an exception is thrown.
    // Otherwise the message will get marked as processed and in normal operation it would not be handled again.
    // Because the order of the messages can not be guaranteed after a failed publication, normal operation
    // is not possible anymore. Therefore we do not catch the AmqpException here and instead let it bubble up,
    // so debezium can catch the exception and terminate. Once the operator has ensured that RabbitMQ is available
    // again, the OutboxEventPublisher can be started again and will automatically reprocess the failed message,
    // because the message has never been marked as processed.
    // TODO: maybe add a retry
    template.send(exchange, routingKey, message);
  }

  private Message createAmqpMessage(String eventId, String payload) {
    var messageProps = new MessageProperties();
    messageProps.setContentType(MessageProperties.CONTENT_TYPE_JSON);
    messageProps.setContentEncoding(StandardCharsets.UTF_8.name());
    messageProps.setMessageId(eventId);

    return new Message(payload.getBytes(StandardCharsets.UTF_8), messageProps);
  }

  @Override
  public boolean supportsTombstoneEvents() {
    return false;
  }

  @Override
  public void close() throws IOException {
    if (connectionFactory != null) {
      connectionFactory.resetConnection();
    }
  }
}
