package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.springframework.format.datetime.DateFormatter;

import java.io.File;
import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.Assert.*;

public class DatasourceTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testDeserialization() throws IOException, ParseException {
    File datasourceConfig = new File("src/test/java/org/jvalue/ods/adapterservice/datasource/model/DatasourceConfig.json");
    Datasource result = mapper.readValue(datasourceConfig, Datasource.class);

    Datasource expectedDatasource = generateDatasource("HTTP", "XML", "http://www.the-inder.net");
    expectedDatasource.setId(123L);

    assertEquals(expectedDatasource, result);
    assertNotNull(result.getId());
    assertTrue(result.getTrigger().isPeriodic());

    DateFormatter dateFormatter = new DateFormatter("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
    dateFormatter.setTimeZone(TimeZone.getTimeZone("UTC"));
    assertEquals("1905-12-01T02:30:00.123Z",
        dateFormatter.print(result.getTrigger().getFirstExecution(), Locale.getDefault()));

    assertEquals(50000, result.getTrigger().getInterval().longValue());
    assertEquals("icke", result.getMetadata().getAuthor());
    assertEquals("none", result.getMetadata().getLicense());
    assertEquals("TestName", result.getMetadata().getDisplayName());
    assertEquals("Describing...", result.getMetadata().getDescription());
    Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
    cal.setTime(result.getMetadata().getCreationTimestamp());
    assertEquals(LocalDateTime.now().getDayOfYear(), cal.get(Calendar.DAY_OF_YEAR));
  }

  @Test
  public void testSerialization() throws ParseException {
    Datasource datasource = generateDatasource("HTTP", "JSON", "http://www.the-inder.net");
    DatasourceTrigger trigger = new DatasourceTrigger(false, new Date(), 10L);
    DatasourceMetadata metadata = new DatasourceMetadata("icke", "none", "Display", "description");
    Datasource config = new Datasource(datasource.getProtocol(), datasource.getFormat(), metadata, trigger);

    JsonNode result = mapper.valueToTree(config);

    System.out.println(result);
    assertEquals(5, result.size());
    assertEquals("HTTP", result.get("protocol").get("type").textValue());
    assertEquals("JSON", result.get("format").get("type").textValue());
    assertEquals("http://www.the-inder.net",
        result.get("protocol").get("parameters").get("location").textValue());
  }

  @Test
  public void testFillQueryParameters() throws ParseException {
    Datasource datasource = generateDatasource("HTTP", "JSON", "http://www.the-inder.net/{userId}/{dataId}");
    Map<String, String> parameters = new HashMap<>();
    parameters.put("userId", "1");
    parameters.put("dataId", "123");
    parameters.put("notAKey", "notAValue");
    RuntimeParameters runtimeParameters = new RuntimeParameters(parameters);
    Datasource newDatasource = datasource.fillQueryParameters(runtimeParameters);
    assertEquals("http://www.the-inder.net/1/123", newDatasource.getProtocol().getParameters().get("location"));
  }

  private Datasource generateDatasource(String protocol, String format, String location) throws ParseException {
    DatasourceProtocol protocolConfig = new DatasourceProtocol(protocol, Map.of("location", location));
    DatasourceFormat formatConfig = new DatasourceFormat(format, Map.of());
    DatasourceMetadata metadata = new DatasourceMetadata("icke", "none", "TestName", "Describing...");
    DatasourceTrigger trigger = new DatasourceTrigger(true, new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").parse("1905-12-01T02:30:00.123Z"), 50000L);
    return new Datasource(protocolConfig, formatConfig, metadata, trigger);
  }
}
