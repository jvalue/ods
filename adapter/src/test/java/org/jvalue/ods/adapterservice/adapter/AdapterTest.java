package org.jvalue.ods.adapterservice.adapter;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataImportResponse;
import org.jvalue.ods.adapterservice.adapter.model.FormatConfig;
import org.jvalue.ods.adapterservice.adapter.model.ProtocolConfig;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AdapterTest {

  private final Adapter adapter = new Adapter();

  @Mock
  Importer importer;
  @Mock
  Protocol httpProtocol;

  @Test
  public void testGetAllProtocols() {
    var protocols = adapter.getAllProtocols();
    assertThat(protocols).extracting(Importer::getType).containsExactlyInAnyOrder("HTTP");
  }

  @Test
  public void testGetAllFormats() {
    var formats = adapter.getAllFormats();
    assertThat(formats).extracting(Interpreter::getType).containsExactlyInAnyOrder("JSON", "XML", "CSV");
  }

  @Test
  public void testExecuteJob() {
    ProtocolConfig protocol = new ProtocolConfig(
      httpProtocol,
      Map.of(
        "location", "http://www.test.com",
        "encoding", "UTF-8"));
    when(httpProtocol.getImporter()).thenReturn(importer);
    FormatConfig format = new FormatConfig(
      Format.XML,
      Collections.emptyMap());
    AdapterConfig adapterConfig = new AdapterConfig(
      protocol, format);

    when(importer.fetch(protocol.parameters)).thenReturn("<greeting><hallo>hello</hallo></greeting>");

    DataImportResponse result = adapter.executeJob(adapterConfig);

    assertEquals(result.getData(), "{\"hallo\":\"hello\"}");
  }
}
