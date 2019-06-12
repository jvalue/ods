package org.jvalue.ods.adapterservice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.HttpResponse;
import org.apache.http.util.EntityUtils;
import org.junit.Test;

import java.io.IOException;

import static org.junit.Assert.assertEquals;
import static util.AdapterApiClient.sendDataImportRequest;
import static util.Constants.RESOURCES_PATH;

public class DataImportExecutionTest extends AbstractApiTest {
    private final ObjectMapper mapper = new ObjectMapper();


    @Test
    public void testJsonHttpDataImport() throws IOException {
        HttpResponse response = sendDataImportRequest(RESOURCES_PATH + "JsonAdapterConfig.json");

        String resultString = EntityUtils.toString(response.getEntity());
        JsonNode resultNode = mapper.readTree(resultString);

        assertEquals(2, resultNode.size());
        assertEquals("sera", resultNode.get("quesera").textValue());
        assertEquals("willbe", resultNode.get("whateverwillbe").textValue());
    }

    @Test
    public void testXmlHttpDataImport() throws IOException {
        HttpResponse response = sendDataImportRequest(RESOURCES_PATH + "XmlAdapterConfig.json");

        String resultString = EntityUtils.toString(response.getEntity());
        JsonNode resultNode = mapper.readTree(resultString);

        System.out.println(resultString);
        assertEquals(4, resultNode.size());
        assertEquals("Tove", resultNode.get("to").textValue());
        assertEquals("Jani", resultNode.get("from").textValue());
        assertEquals("Reminder", resultNode.get("heading").textValue());
        assertEquals("Don't forget me this weekend!", resultNode.get("body").textValue());
    }

}
