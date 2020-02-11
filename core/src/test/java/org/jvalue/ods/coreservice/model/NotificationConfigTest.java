package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.InvalidTypeIdException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import org.junit.Test;
import org.jvalue.ods.coreservice.model.notification.*;

import java.io.IOException;

import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertEquals;

public class NotificationConfigTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testWebhookDeserialization() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthisthenthat\"," +
      "\"type\":\"WEBHOOK\"," +
      "\"url\":\"URRRRRL\"" +
      "}";

    WebhookNotification result = mapper.readValue(configString, WebhookNotification.class);

    assertEquals("ifthisthenthat", result.getCondition());
    assertEquals(NotificationType.WEBHOOK, result.getType());
    assertEquals("URRRRRL", result.getUrl());
  }

  @Test
  public void testSlackDeserialization() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthenelse\"," +
      "\"type\":\"SLACK\"," +
      "\"workspaceId\":\"12\"," +
      "\"channelId\":\"34\"," +
      "\"secret\":\"56\"}";

    SlackNotification result = mapper.readValue(configString, SlackNotification.class);
    assertEquals("ifthenelse", result.getCondition());
    assertEquals("12", result.getWorkspaceId());
    assertEquals("34", result.getChannelId());
    assertEquals("56", result.getSecret());
  }

  @Test
  public void testFirebaseDeserialization() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthenelse\"," +
      "\"type\":\"FCM\"," +
      "\"projectId\":\"12\"," +
      "\"clientEmail\":\"fire@base.com\"," +
      "\"privateKey\":\"1234\"," +
      "\"topic\":\"weather\"}";

    FirebaseNotification result = mapper.readValue(configString, FirebaseNotification.class);
    assertEquals("ifthenelse", result.getCondition());
    assertEquals("12", result.getProjectId());
    assertEquals("fire@base.com", result.getClientEmail());
    assertEquals("1234", result.getPrivateKey());
    assertEquals("weather", result.getTopic());
  }

  @Test(expected = InvalidTypeIdException.class)
  public void testDeserializationOfInvalidType() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthisthenthat\"," +
      "\"type\":\"lol\"," +
      "\"url\":\"URRRRRL\"" +
      "}";
    mapper.readValue(configString, NotificationConfig.class);
  }

  @Test(expected = JsonMappingException.class)
  public void testDeserializationOfInvalidParams() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthisthenthat\"," +
      "\"type\":\"WEBHOOK\"," +
      "\"url\":\"URRRRRL\"," +
      "\"extra\":\"bonus\"" +
      "}";
    mapper.readValue(configString, NotificationConfig.class);
  }

  @Test(expected = MismatchedInputException.class)
  public void testDeserializationMissingParams() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthisthenthat\"," +
      "\"type\":\"WEBHOOK\"" +
      "}";
    mapper.readValue(configString, NotificationConfig.class);
  }

  @Test(expected = JsonMappingException.class)
  public void testDeserializationWrongType() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthenelse\"," +
      "\"type\":\"SLACK\"," +
      "\"projectId\":\"12\"," +
      "\"clientEmail\":\"fire@base.com\"," +
      "\"privateKey\":\"1234\"," +
      "\"topic\":\"weather\"}";
    mapper.readValue(configString, NotificationConfig.class);
  }

  @Test
  public void testWebhookSerialization() {
    WebhookNotification notification = new WebhookNotification("1>2", "URRL");

    JsonNode result = mapper.valueToTree(notification);

    System.out.println(result);
    assertEquals(4, result.size());
    assertEquals("1>2", result.get("condition").asText());
    assertTrue(result.has("notificationId")); // is always <null> in testing because it is set by the JPA
    assertEquals("URRL", result.get("url").asText());
    assertEquals("WEBHOOK", result.get("type").asText());
  }


  @Test
  public void testSlackSerialization() {
    SlackNotification notification = new SlackNotification("1>2", "1", "2", "3");

    JsonNode result = mapper.valueToTree(notification);

    System.out.println(result);
    assertEquals(6, result.size());
    assertEquals("1>2", result.get("condition").asText());
    assertTrue(result.has("notificationId")); // is always <null> in testing because it is set by the JPA
    assertEquals("1", result.get("workspaceId").asText());
    assertEquals("2", result.get("channelId").asText());
    assertEquals("3", result.get("secret").asText());
    assertEquals("SLACK", result.get("type").asText());
  }

  @Test
  public void testFirebaseSerialization() {
    FirebaseNotification notification = new FirebaseNotification("1>2", "2", "a@b.c", "1", "topic");

    JsonNode result = mapper.valueToTree(notification);

    System.out.println(result);
    assertEquals(7, result.size());
    assertEquals("1>2", result.get("condition").asText());
    assertTrue(result.has("notificationId")); // is always <null> in testing because it is set by the JPA
    assertEquals("FCM", result.get("type").asText());
    assertEquals("2", result.get("projectId").asText());
    assertEquals("a@b.c", result.get("clientEmail").asText());
    assertEquals("1", result.get("privateKey").asText());
    assertEquals("topic", result.get("topic").asText());
  }
}
