package org.jvalue.ods.adapterservice.adapter;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.mockito.InjectMocks;
import org.mockito.junit.MockitoJUnitRunner;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(MockitoJUnitRunner.class)
public class AdapterTest {

  @InjectMocks
  private Adapter adapter;

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
}
