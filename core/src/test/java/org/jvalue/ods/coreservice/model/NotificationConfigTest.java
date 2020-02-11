package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.exc.InvalidTypeIdException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import org.junit.Test;

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

    NotificationConfig result = mapper.readValue(configString, NotificationConfig.class);

    assertEquals("ifthisthenthat", result.getCondition());
    assertTrue(result.getParams() instanceof NotificationConfig.WebhookParams);
    assertEquals("URRRRRL", result.getParams().asWebhook().getUrl());
  }

  @Test
  public void testSlackDeserialization() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthenelse\"," +
      "\"type\":\"SLACK\"," +
      "\"workspaceId\":\"12\"," +
      "\"channelId\":\"34\"," +
      "\"secret\":\"56\"}";

    NotificationConfig result = mapper.readValue(configString, NotificationConfig.class);
    assertEquals("ifthenelse", result.getCondition());
    NotificationConfig.SlackParams params = result.getParams().asSlack();
    assertEquals("12", params.getWorkspaceId());
    assertEquals("34", params.getChannelId());
    assertEquals("56", params.getSecret());
  }

  @Test
  public void testFirebaseDeserialization() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthenelse\"," +
      "\"params\":{" +
      "\"type\":\"FCM\"," +
      "\"projectId\":\"12\"," +
      "\"clientEmail\":\"fire@base.com\"," +
      "\"privateKey\":\"1234\"," +
      "\"topic\":\"weather\"}}";

    NotificationConfig result = mapper.readValue(configString, NotificationConfig.class);
    assertEquals("ifthenelse", result.getCondition());
    NotificationConfig.FirebaseParams params = result.getParams().asFirebase();
    assertEquals("12", params.getProjectId());
    assertEquals("fire@base.com", params.getClientEmail());
    assertEquals("1234", params.getPrivateKey());
    assertEquals("weather", params.getTopic());
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
      "\"params\":{" +
      "\"type\":\"WEBHOOK\"," +
      "\"url\":\"URRRRRL\"" +
      "\"extra\":\"bonus\"" +
      "}}";
    mapper.readValue(configString, NotificationConfig.class);
  }

  @Test(expected = MismatchedInputException.class)
  public void testDeserializationMissingParams() throws IOException {
    final String configString = "{ " +
      "\"condition\":\"ifthisthenthat\"," +
      "\"params\":{" +
        "\"type\":\"WEBHOOK\"" +
      "}}";
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
  public void testSerialization() {
    NotificationConfig notification = new NotificationConfig("1>2", new NotificationConfig.WebhookParams("URRL"));

    JsonNode result = mapper.valueToTree(notification);

    System.out.println(result);
    assertEquals(4, result.size());
    assertEquals("1>2", result.get("condition").asText());
    assertTrue(result.has("notificationId")); // is always <null> in testing because it is set by the JPA
    assertEquals("URRL", result.get("url").asText());
    assertEquals("WEBHOOK", result.get("type").asText());
  }
}
