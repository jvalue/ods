package org.jvalue.ods.adapterservice.datasource.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class DatasourceEventTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    public void testSerialization() {
        DatasourceEvent event = new DatasourceEvent(EventType.DATASOURCE_CREATE, 123L);

        JsonNode result = mapper.valueToTree(event);

        System.out.println(result);
        assertEquals(3, result.size());
        assertEquals("DATASOURCE_CREATE", result.get("eventType").textValue());
        assertEquals(123L, result.get("datasourceId").longValue());
    }

}
