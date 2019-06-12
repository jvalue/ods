package org.jvalue.ods.adapterservice;

import org.apache.http.HttpResponse;
import org.apache.http.util.EntityUtils;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;
import static util.AdapterApiClient.sendFormatsRequest;

public class GetFormatsTest {

    @Test
    public void testGetFormats() throws IOException {
        HttpResponse response = sendFormatsRequest();

        String result = EntityUtils.toString(response.getEntity());

        assertEquals("[" +
                "{\"type\":\"JSON\",\"parameters\":{}}," +
                "{\"type\":\"XML\",\"parameters\":{}}" +
                "]",
                result);
    }
}
