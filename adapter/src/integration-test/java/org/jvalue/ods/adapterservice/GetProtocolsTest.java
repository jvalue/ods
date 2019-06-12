package org.jvalue.ods.adapterservice;

import org.apache.http.HttpResponse;
import org.apache.http.util.EntityUtils;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;
import static util.AdapterApiClient.sendProtocolsRequest;

public class GetProtocolsTest extends AbstractApiTest {

    @Test
    public void testGetProtocols() throws IOException {
        HttpResponse response = sendProtocolsRequest();

        String result = EntityUtils.toString(response.getEntity());

        assertEquals("[{\"type\":\"HTTP\",\"parameters\":{},\"description\":\"Plain HTTP\"}]", result);
    }
}
