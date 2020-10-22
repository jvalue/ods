package org.jvalue.ods.adapterservice.adapter;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.FormatConfig;
import org.jvalue.ods.adapterservice.adapter.model.ProtocolConfig;
import org.mockito.InjectMocks;
import org.mockito.junit.MockitoJUnitRunner;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertEquals;
import static org.jvalue.ods.adapterservice.adapter.Format.*;
import static org.jvalue.ods.adapterservice.adapter.Protocol.HTTP;

@RunWith(MockitoJUnitRunner.class)
public class AdapterFactoryTest {

  @InjectMocks
  private AdapterFactory adapterFactory;

  @Test
  public void testGetHTTPJSONAdapter() {
    AdapterConfig config = new AdapterConfig(new ProtocolConfig(HTTP, Map.of("location", "location")), new FormatConfig(JSON, Map.of()));
    Adapter result = adapterFactory.getAdapter(config);
    assertEquals("HTTP", result.protocol());
    assertEquals("JSON", result.format());
  }

  @Test
  public void testGetHTTPXMLAdapter() {
    AdapterConfig config = new AdapterConfig(new ProtocolConfig(HTTP, Map.of("location", "location")), new FormatConfig(XML, Map.of()));
    Adapter result = adapterFactory.getAdapter(config);
    assertEquals("HTTP", result.protocol());
    assertEquals("XML", result.format());
  }

  @Test
  public void testGetHTTPCSVAdapter() {
    AdapterConfig config = new AdapterConfig(new ProtocolConfig(HTTP, Map.of("location", "location")), new FormatConfig(CSV, Map.of()));
    Adapter result = adapterFactory.getAdapter(config);
    assertEquals("HTTP", result.protocol());
    assertEquals("CSV", result.format());
  }

  @Test
  public void testGetAllProtocols() {
    var protocols = adapterFactory.getAllProtocols();
    assertThat(protocols).extracting(Importer::getType).containsExactlyInAnyOrder("HTTP");
  }

  @Test
  public void testGetAllFormats() {
    var formats = adapterFactory.getAllFormats();
    assertThat(formats).extracting(Interpreter::getType).containsExactlyInAnyOrder("JSON", "XML", "CSV");
  }
}
