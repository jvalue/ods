package org.jvalue.ods.adapterservice;

import org.junit.BeforeClass;
import util.HttpServiceCheck;

import static util.Constants.VERSION_ENDPOINT;


public abstract class AbstractApiTest {

    @BeforeClass
    public static void checkAvailability() {
        boolean isAvailable = HttpServiceCheck.check(VERSION_ENDPOINT);
        if(!isAvailable) {
            throw new IllegalStateException("API at URI "+ VERSION_ENDPOINT +" is not available! Aborting...");
        }
    }

}
