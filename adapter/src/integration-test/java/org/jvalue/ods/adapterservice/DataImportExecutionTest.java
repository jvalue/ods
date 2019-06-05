package org.jvalue.ods.adapterservice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.HttpResponse;
import org.apache.http.util.EntityUtils;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;
import static util.AdapterApiClient.sendDataImportRequest;

public class DataImportExecutionTest extends AbstractApiTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    public void testDataImport() throws IOException {
        HttpResponse response = sendDataImportRequest();

        String resultString = EntityUtils.toString(response.getEntity());
        JsonNode resultNode = mapper.readTree(resultString);

        assertEquals(2, resultNode.size());
        assertEquals("sera", resultNode.get("quesera").textValue());
        assertEquals("willbe", resultNode.get("whateverwillbe").textValue());
    }

}
