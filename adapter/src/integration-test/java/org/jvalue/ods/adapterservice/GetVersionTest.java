package org.jvalue.ods.adapterservice;

import org.apache.http.HttpResponse;
import org.apache.http.util.EntityUtils;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;
import static util.AdapterApiClient.sendGetVersionRequest;

public class GetVersionTest extends AbstractApiTest {

    @Test
    public void getVersion() throws IOException {
        HttpResponse response = sendGetVersionRequest();

        String result = EntityUtils.toString(response.getEntity());

        assertEquals("1.0", result);
    }
}
