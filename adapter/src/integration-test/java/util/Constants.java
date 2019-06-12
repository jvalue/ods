package util;

public final class Constants {

    //Endpoint URLs
    public static final String ADAPTERSERVICE_URL = "http://localhost:8080/";
    public static final String VERSION_ENDPOINT = ADAPTERSERVICE_URL + "version";
    public static final String PROTOCOLS_ENDPOINT = ADAPTERSERVICE_URL + "protocols";
    public static final String FORMATS_ENDPOINT = ADAPTERSERVICE_URL + "formats";

    //Paths
    public static final String RESOURCES_PATH = "./src/integration-test/resources/";

    private Constants() {
    }
}
