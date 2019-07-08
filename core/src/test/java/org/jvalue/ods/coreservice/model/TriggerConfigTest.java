package org.jvalue.ods.coreservice.model;


import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.*;

public class TriggerConfigTest {
private ObjectMapper mapper = new ObjectMapper();

    @Test
    public void testDeserialization() throws IOException {
        String triggerConf = "{" +
                "\"periodic\": false," +
                "\"firstExecution\":\"2021-03-03T21:20:19.123\"" +
                "}";

        PipelineTriggerConfig result = mapper.readValue(triggerConf, PipelineTriggerConfig.class);

        assertFalse(result.isPeriodic());
        assertNull(result.getInterval());
        assertEquals("2021-03-03T21:20:19.123", result.getFirstExecution().toString());
    }

}
