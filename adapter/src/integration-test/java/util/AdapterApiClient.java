package util;

import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.impl.client.HttpClientBuilder;

import java.io.FileInputStream;
import java.io.IOException;

import static util.Constants.*;

public class AdapterApiClient {

    public static HttpResponse sendGetVersionRequest() throws IOException {
        HttpGet request = new HttpGet(VERSION_ENDPOINT);

        return HttpClientBuilder.create().build().execute(request);
    }

    public static HttpResponse sendDataImportRequest(String CONFIG_PATH) throws IOException {
        HttpPost request = new HttpPost(ADAPTERSERVICE_URL + "dataImport");

        FileInputStream jsonStream = new FileInputStream(CONFIG_PATH);
        InputStreamEntity entity = new InputStreamEntity(jsonStream);

        request.setEntity(entity);
        request.setHeader("Accept", "application/json");
        request.setHeader("Content-Type", "application/json");

        return execute(request);
    }

    public static HttpResponse sendProtocolsRequest() throws IOException {
        HttpGet request = new HttpGet(PROTOCOLS_ENDPOINT);

        return execute(request);
    }

    public static HttpResponse sendFormatsRequest() throws IOException {
        HttpGet request = new HttpGet(FORMATS_ENDPOINT);

        return execute(request);
    }

    private static HttpResponse execute(HttpRequestBase request) throws IOException {
        return HttpClientBuilder.create().build().execute(request);
    }
}
