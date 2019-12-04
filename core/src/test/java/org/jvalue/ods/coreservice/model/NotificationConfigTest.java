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
      "\"notificationType\":\"WEBHOOK\"," +
      "\"condition\":\"ifthisthenthat\"," +
      "\"url\":\"URRRRRL\"" +
      "}";

    NotificationConfig result = mapper.readValue(configString, NotificationConfig.class);

    System.out.println(result);
    assertEquals("WEBHOOK", result.getNotificationType().toString());
    assertEquals("ifthisthenthat", result.getCondition());
    assertEquals("URRRRRL", result.getUrl());
  }

  @Test
  public void testSerialization() throws IOException {
    NotificationConfig notification = new NotificationConfig(NotificationType.WEBHOOK, "1>2", "URRL");

    JsonNode result = mapper.valueToTree(notification);

    System.out.println(result);
    assertEquals(4, result.size());
    assertEquals("WEBHOOK", result.get("notificationType").asText());
    assertEquals("1>2", result.get("condition").asText());
    assertEquals("URRL", result.get("url").asText());
    assertTrue(result.has("notificationId")); // is always <null> in testing because it is set by the JPA
  }
}
