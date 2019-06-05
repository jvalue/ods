package org.jvalue.ods.adapterservice.adapter;

import org.junit.Test;
import org.jvalue.ods.adapterservice.model.AdapterConfig;

import static org.junit.Assert.assertEquals;

public class AdapterManagerTest {

    @Test
    public void testGetHTTPJSONAdapter() {
        AdapterConfig config = new AdapterConfig("HTTP", "JSON", "location");
        Adapter result = AdapterManager.getAdapter(config);
        assertEquals("HTTP", result.protocol());
        assertEquals("JSON", result.format());
    }
}
