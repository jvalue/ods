package org.jvalue.ods.adapterservice;

import org.junit.BeforeClass;
import util.HttpServiceCheck;

import static util.AdapterApiClient.ADAPTERSERVICE_URL;


public abstract class AbstractApiTest {

    private static final String VERSION_ENDPOINT = ADAPTERSERVICE_URL + "api/version";

    @BeforeClass
    public static void checkAvailability() {
        boolean isAvailable = HttpServiceCheck.check(VERSION_ENDPOINT);
        if(!isAvailable) {
            throw new IllegalStateException("API at URI "+ VERSION_ENDPOINT +" is not available! Aborting...");
        }
    }

}
