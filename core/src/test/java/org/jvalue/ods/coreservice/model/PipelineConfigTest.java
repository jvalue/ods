package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.jvalue.ods.coreservice.model.notification.NotificationConfig;
import org.jvalue.ods.coreservice.model.notification.WebhookNotification;
import org.springframework.format.datetime.DateFormatter;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.Assert.*;

public class PipelineConfigTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testDeserialization() throws IOException {
    File pipelineConfig = new File("src/test/java/org/jvalue/ods/coreservice/model/PipelineConfig.json");
    PipelineConfig result = mapper.readValue(pipelineConfig, PipelineConfig.class);

    System.out.println(result);
    assertEquals(2, result.getTransformations().size());
    assertNotNull(result.getId());

    DateFormatter dateFormatter = new DateFormatter("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
    dateFormatter.setTimeZone(TimeZone.getTimeZone("UTC"));

    assertEquals("icke", result.getMetadata().getAuthor());
    assertEquals("none", result.getMetadata().getLicense());
    assertEquals("TestName", result.getMetadata().getDisplayName());
    assertEquals("Describing...", result.getMetadata().getDescription());
    Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
    cal.setTime(result.getMetadata().getCreationTimestamp());
    assertEquals(LocalDateTime.now().getDayOfYear(), cal.get(Calendar.DAY_OF_YEAR));
    assertEquals(1, result.getNotifications().size());
    assertNotNull(result.getNotifications().get(0));
    assertEquals("data.value1 > 10", result.getNotifications().get(0).getCondition());
    assertEquals("http://www.webhookland.com", ((WebhookNotification) result.getNotifications().get(0)).getUrl());
  }

  @Test
  public void testSerialization() {
    List<TransformationConfig> transformations = List.of(new TransformationConfig("return 1+1", "[1]"),
        new TransformationConfig("data * 10", "[2]"));
    PipelineMetadata metadata = new PipelineMetadata("icke", "none", "Display", "description");
    List<NotificationConfig> notifications = List.of(
        new WebhookNotification("data.value1 > 10", "http://www.webhookland.com/1"),
        new WebhookNotification("data.value1 < 0", "http://www.webhookland.com/2"));
    PipelineConfig config = new PipelineConfig(1L, transformations, metadata, notifications);

    JsonNode result = mapper.valueToTree(config);

    System.out.println(result);
    assertEquals(5, result.size());
    assertEquals(2, result.get("transformations").size());
    assertEquals("return 1+1", result.get("transformations").get(0).get("func").textValue());
    assertEquals("[2]", result.get("transformations").get(1).get("data").textValue());
    assertEquals(2, result.get("notifications").size());
    assertEquals(4, result.get("notifications").get(0).size());
    assertEquals("data.value1 > 10", result.get("notifications").get(0).get("condition").textValue());
    assertEquals("WEBHOOK", result.get("notifications").get(0).get("type").textValue());
    assertEquals("http://www.webhookland.com/2", result.get("notifications").get(1).get("url").textValue());
  }
}
