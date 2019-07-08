package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;

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
        assertEquals(result.getId(), result.getPersistence().getPipelineid());
        assertTrue(result.getTrigger().isPeriodic());
        assertEquals(LocalDateTime.parse("1905-12-01T02:30:00.123"), result.getTrigger().getFirstExecution());
        assertEquals(50000, result.getTrigger().getInterval().longValue());
        assertEquals("icke", result.getMetadata().getAuthor());
        assertEquals("none", result.getMetadata().getLicense());
        assertEquals(LocalDateTime.now().getDayOfYear(), result.getMetadata().getCreationTimestamp().getDayOfYear());
    }
}
