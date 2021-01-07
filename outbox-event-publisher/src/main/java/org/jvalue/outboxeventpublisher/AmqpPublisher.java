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

@Slf4j
public class AmqpPublisher implements DebeziumEngine.ChangeConsumer<SourceRecord>, Closeable {
  private static final String AMQP_URL = "amqp.url";
  private static final String AMQP_EXCHANGE = "amqp.exchange";

  private CachingConnectionFactory connectionFactory;
  private AmqpTemplate template;
  private String exchange;

  public void init(Configuration config) {
    this.exchange = config.getString(AMQP_EXCHANGE);
    this.connectionFactory = new CachingConnectionFactory(URI.create(config.getString(AMQP_URL)));
    this.template = new RabbitTemplate(connectionFactory);
    this.connectionFactory.createConnection();
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
    var topic = record.topic();
    var eventId = (String) record.key();
    var payload = (String) record.value();

    log.info("Publishing event {} with topic {}", eventId, topic);

    var message = createAmqpMessage(eventId, payload);
    //TODO: maybe add a retry, but if it still fails, throw an exception to stop debezium.
    // In that case new events can also not be processed, because we would then lose the order.
    template.send(exchange, topic, message);
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
