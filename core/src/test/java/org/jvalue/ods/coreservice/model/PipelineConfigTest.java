package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
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
    assertEquals("return data+data;", result.getTransformation().getFunc());
    assertEquals("[1]", result.getTransformation().getData());
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
  }

  @Test
  public void testSerialization() {
    TransformationConfig transformation = new TransformationConfig("return 1+1", "[1]");
    PipelineMetadata metadata = new PipelineMetadata("icke", "none", "Display", "description");
    PipelineConfig config = new PipelineConfig(1L, transformation, metadata);

    JsonNode result = mapper.valueToTree(config);

    System.out.println(result);
    assertEquals(4, result.size());
    assertEquals("return 1+1", result.get("transformation").get("func").textValue());
    assertEquals("[1]", result.get("transformation").get("data").textValue());
  }
}
