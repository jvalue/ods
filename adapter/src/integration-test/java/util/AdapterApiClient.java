package util;

import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.impl.client.HttpClientBuilder;

import java.io.FileInputStream;
import java.io.IOException;

public class AdapterApiClient {

    public static final String ADAPTERSERVICE_URL = "http://localhost:8080/";

    public static HttpResponse sendGetVersionRequest() throws IOException {
        HttpGet request = new HttpGet(ADAPTERSERVICE_URL + "api/version");

        return HttpClientBuilder.create().build().execute(request);
    }

    public static HttpResponse sendDataImportRequest(String CONFIG_PATH) throws IOException {
        HttpPost request = new HttpPost(ADAPTERSERVICE_URL + "dataImport");

        FileInputStream jsonStream = new FileInputStream(CONFIG_PATH);
        InputStreamEntity entity = new InputStreamEntity(jsonStream);

        request.setEntity(entity);
        request.setHeader("Accept", "application/json");
        request.setHeader("Content-Type", "application/json");

        return HttpClientBuilder.create().build().execute(request);
    }
}
