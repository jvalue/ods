package org.jvalue.outboxeventpublisher;

import io.debezium.config.Configuration;
import io.debezium.engine.DebeziumEngine;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.connect.source.SourceRecord;

import java.io.Closeable;
import java.io.IOException;
import java.util.List;

@Slf4j
@AllArgsConstructor
public class AmqpPublisher implements DebeziumEngine.ChangeConsumer<SourceRecord>, Closeable {
  private static final String AMQP_HOST = "amqp.host";
  private static final String AMQP_PORT = "amqp.port";
  private static final String AMQP_USERNAME = "amqp.username";
  private static final String AMQP_PASSWORD = "amqp.password";
  private static final String AMQP_EXCHANGE = "amqp.exchange";

  private final Configuration config;

  @Override
  public void handleBatch(List<SourceRecord> records, DebeziumEngine.RecordCommitter<SourceRecord> committer) throws InterruptedException {
    for (var record : records) {
      handleSourceRecord(record);
      committer.markProcessed(record);
    }
    committer.markBatchFinished();
  }

  private void handleSourceRecord(SourceRecord record) {
    var topic = record.topic();
    var eventId = (String) record.key();
    var payload = (String) record.value();

    log.info("Publishing event {} with topic {}", eventId, topic);
  }

  @Override
  public boolean supportsTombstoneEvents() {
    return false;
  }

  @Override
  public void close() throws IOException {

  }
}
