package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.io.IOException;

import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertEquals;

public class NotificationConfigTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testDeserialization() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthisthenthat\"," +
      "\"params\":{" +
        "\"type\":\"WEBHOOK\"," +
        "\"url\":\"URRRRRL\"" +
      "}}";

    NotificationConfig result = mapper.readValue(configString, NotificationConfig.class);

    System.out.println(result);
    assertEquals("ifthisthenthat", result.getCondition());
    assertTrue(result.getParams() instanceof NotificationConfig.WebhookParams);
    assertEquals("URRRRRL", result.getParams().asWebhook().getUrl());
  }

  @Test
  public void testSerialization() {
    NotificationConfig notification = new NotificationConfig("1>2", new NotificationConfig.WebhookParams("URRL"));

    JsonNode result = mapper.valueToTree(notification);

    System.out.println(result);
    assertEquals(3, result.size());
    assertEquals("1>2", result.get("condition").asText());
    assertTrue(result.has("notificationId")); // is always <null> in testing because it is set by the JPA
    assertEquals(2, result.get("params").size());
    assertEquals("URRL", result.get("params").get("url").asText());
    assertEquals("WEBHOOK", result.get("params").get("type").asText());
  }
}
