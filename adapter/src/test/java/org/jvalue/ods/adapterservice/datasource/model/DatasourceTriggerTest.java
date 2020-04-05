package org.jvalue.ods.adapterservice.datasource.model;


import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.springframework.format.datetime.DateFormatter;

import java.io.IOException;
import java.util.Locale;
import java.util.TimeZone;

import static org.junit.Assert.*;

public class DatasourceTriggerTest {
    private ObjectMapper mapper = new ObjectMapper()
            .findAndRegisterModules();

    @Test
    public void testDeserialization() throws IOException {
        String triggerConf = "{" +
                "\"periodic\": false," +
                "\"firstExecution\":\"2021-03-03T21:20:19.123Z\"" +
                "}";

        DatasourceTrigger result = mapper.readValue(triggerConf, DatasourceTrigger.class);

        assertFalse(result.isPeriodic());
        assertNull(result.getInterval());
        DateFormatter dateFormatter = new DateFormatter("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
        dateFormatter.setTimeZone(TimeZone.getTimeZone("UTC"));
        assertEquals("2021-03-03T21:20:19.123Z", dateFormatter.print(result.getFirstExecution(), Locale.getDefault()));
    }

}
