package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.jvalue.ods.coreservice.model.event.EventType;
import org.jvalue.ods.coreservice.model.event.PipelineEvent;

import static org.junit.Assert.assertEquals;

public class PipelineEventTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    public void testSerialization() {
        PipelineEvent event = new PipelineEvent(EventType.PIPELINE_CREATE, 123L);

        JsonNode result = mapper.valueToTree(event);

        System.out.println(result);
        assertEquals(3, result.size());
        assertEquals("PIPELINE_CREATE", result.get("eventType").textValue());
        assertEquals(123L, result.get("pipelineId").longValue());
    }

}
