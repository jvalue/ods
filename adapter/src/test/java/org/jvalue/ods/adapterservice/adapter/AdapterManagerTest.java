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

    @Test
    public void testGetHTTPXMLAdapter() {
        AdapterConfig config = new AdapterConfig("HTTP", "XML", "location");
        Adapter result = AdapterManager.getAdapter(config);
        assertEquals("HTTP", result.protocol());
        assertEquals("XML", result.format());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testNotExistingProtocol() {
        AdapterConfig config = new AdapterConfig("N/A", "XML", "location");
        AdapterManager.getAdapter(config);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testNotExistingFormat() {
        AdapterConfig config = new AdapterConfig("HTTP", "N/A", "location");
        AdapterManager.getAdapter(config);
    }
}
