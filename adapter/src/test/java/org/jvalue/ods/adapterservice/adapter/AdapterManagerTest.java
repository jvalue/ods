package org.jvalue.ods.adapterservice.adapter;

import org.junit.Test;
import org.jvalue.ods.adapterservice.model.AdapterConfig;
import org.jvalue.ods.adapterservice.model.FormatConfig;
import org.jvalue.ods.adapterservice.model.ProtocolConfig;

import static org.junit.Assert.assertEquals;

public class AdapterManagerTest {

    @Test
    public void testGetHTTPJSONAdapter() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("HTTP", "location"), new FormatConfig("JSON"));
        Adapter result = AdapterManager.getAdapter(config);
        assertEquals("HTTP", result.protocol());
        assertEquals("JSON", result.format());
    }

    @Test
    public void testGetHTTPXMLAdapter() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("HTTP", "location"), new FormatConfig("XML"));
        Adapter result = AdapterManager.getAdapter(config);
        assertEquals("HTTP", result.protocol());
        assertEquals("XML", result.format());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testNotExistingProtocol() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("N/A", "location"), new FormatConfig("XML"));
        AdapterManager.getAdapter(config);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testNotExistingFormat() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("HTTP", "N/A"), new FormatConfig("location"));
        AdapterManager.getAdapter(config);
    }
}
