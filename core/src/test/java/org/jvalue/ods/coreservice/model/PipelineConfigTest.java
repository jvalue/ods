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
        AdapterConfig expectedAdapter = new AdapterConfig("HTTP", "XML", "http://www.the-inder.net");
        assertEquals(expectedAdapter, result.getAdapter());
        assertEquals(2, result.getTransformations().size());
        assertNotNull(result.getId());
        assertTrue(result.getTrigger().isPeriodic());

        DateFormatter dateFormatter = new DateFormatter("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
        dateFormatter.setTimeZone(TimeZone.getTimeZone("UTC"));
        assertEquals("1905-12-01T02:30:00.123Z", dateFormatter.print(result.getTrigger().getFirstExecution(), Locale.getDefault()));
        
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
    public void testSerialization() {
        AdapterConfig adapter = new AdapterConfig("HTTP", "JSON", "http://www.the-inder.net");
        List<TransformationConfig> transformations = List.of(
                new TransformationConfig("return 1+1", "[1]"),
                new TransformationConfig("data * 10", "[2]")
                );
        PipelineTriggerConfig trigger = new PipelineTriggerConfig(false, new Date(), 10L);
        PipelineMetadata metadata = new PipelineMetadata("icke", "none", "Display", "description");
        PipelineConfig config = new PipelineConfig(adapter, transformations, trigger, metadata);

        JsonNode result = mapper.valueToTree(config);

        System.out.println(result);
        assertEquals(5, result.size());
        assertEquals("HTTP", result.get("adapter").get("protocol").textValue());
        assertEquals("JSON", result.get("adapter").get("format").textValue());
        assertEquals("http://www.the-inder.net", result.get("adapter").get("location").textValue());
        assertEquals(2, result.get("transformations").size());
        assertEquals("return 1+1", result.get("transformations").get(0).get("func").textValue());
        assertEquals("[2]", result.get("transformations").get(1).get("data").textValue());

    }
}
