package org.jvalue.ods.adapterservice.adapter;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.jvalue.ods.adapterservice.model.AdapterConfig;
import org.jvalue.ods.adapterservice.model.FormatConfig;
import org.jvalue.ods.adapterservice.model.ProtocolConfig;
import org.jvalue.ods.adapterservice.repository.DataBlobRepository;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import static org.junit.Assert.assertEquals;

import java.util.Map;

@RunWith(MockitoJUnitRunner.class)
public class AdapterRepositoryTest {

    @Mock
    private DataBlobRepository dataBlobRepository;

    @InjectMocks
    private AdapterRepository adapterRepository;

    @Test
    public void testGetHTTPJSONAdapter() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("HTTP", Map.of("location", "location")), new FormatConfig("JSON", Map.of()));
        Adapter result = adapterRepository.getAdapter(config);
        assertEquals("HTTP", result.protocol());
        assertEquals("JSON", result.format());
    }

    @Test
    public void testGetHTTPXMLAdapter() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("HTTP", Map.of("location", "location")), new FormatConfig("XML", Map.of()));
        Adapter result = adapterRepository.getAdapter(config);
        assertEquals("HTTP", result.protocol());
        assertEquals("XML", result.format());
    }

    @Test(expected = IllegalArgumentException.class)
    public void testNotExistingProtocol() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("N/A", Map.of("location", "location")), new FormatConfig("XML", Map.of()));
        adapterRepository.getAdapter(config);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testNotExistingFormat() {
        AdapterConfig config = new AdapterConfig(new ProtocolConfig("HTTP", Map.of("location", "N/A")), new FormatConfig("location", Map.of()));
        adapterRepository.getAdapter(config);
    }
}
