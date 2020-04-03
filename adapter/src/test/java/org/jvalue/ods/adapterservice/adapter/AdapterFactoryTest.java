package org.jvalue.ods.adapterservice.adapter;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.FormatConfig;
import org.jvalue.ods.adapterservice.adapter.model.ProtocolConfig;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import static org.junit.Assert.assertEquals;

import java.util.Map;

@RunWith(MockitoJUnitRunner.class)
public class AdapterFactoryTest {

    @Mock
    private DataBlobRepository dataBlobRepository;

    @InjectMocks
    private AdapterFactory adapterFactory;

    @Test
    public void testGetHTTPJSONAdapter() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("HTTP", Map.of("location", "location")), new FormatConfig("JSON", Map.of()));
        Adapter result = adapterFactory.getAdapter(config);
        assertEquals("HTTP", result.protocol());
        assertEquals("JSON", result.format());
    }

    @Test
    public void testGetHTTPXMLAdapter() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("HTTP", Map.of("location", "location")), new FormatConfig("XML", Map.of()));
        Adapter result = adapterFactory.getAdapter(config);
        assertEquals("HTTP", result.protocol());
        assertEquals("XML", result.format());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testNotExistingProtocol() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("N/A", Map.of("location", "location")), new FormatConfig("XML", Map.of()));
        adapterFactory.getAdapter(config);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testNotExistingFormat() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("HTTP", Map.of("location", "N/A")), new FormatConfig("location", Map.of()));
        adapterFactory.getAdapter(config);
    }
}
