package org.jvalue.outboxeventpublisher;

public class Main {
  public static void main(String[] args) throws Exception {
    var publisher = new OutboxEventPublisher();
    publisher.init();
    Runtime.getRuntime().addShutdownHook(new Thread(publisher::stop));
    publisher.start();
  }
}
