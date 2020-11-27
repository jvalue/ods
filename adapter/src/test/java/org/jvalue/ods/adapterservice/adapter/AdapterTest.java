package org.jvalue.ods.adapterservice.adapter;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.jvalue.ods.adapterservice.adapter.model.FormatConfig;
import org.jvalue.ods.adapterservice.adapter.model.ProtocolConfig;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.util.Collections;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@RunWith(MockitoJUnitRunner.class)
public class AdapterTest {

  @InjectMocks
  private Adapter adapter;

  @Mock Importer importer;
  @Mock DataBlobRepository dataBlobRepository;
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
    assertThat(formats).extracting(Interpreter::getType).containsExactlyInAnyOrder("JSON", "XML", "CSV", "RAW");
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

    when(dataBlobRepository.save(any(DataBlob.class))).thenAnswer(i -> i.getArguments()[0]);

    DataBlob result = adapter.executeJob(adapterConfig);

    assertEquals(result.getData(), "{\"hallo\":\"hello\"}");
    assertEquals(result.getMetaData().getLocation(), "/data/null");
    assertNull(result.getId());
  }
}
