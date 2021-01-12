package org.jvalue.ods.adapterservice.adapter.api.rest.v1;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
public class ProtocolEndpoint {

  private final Adapter adapter;

  public ProtocolEndpoint(Adapter adapter) {
    this.adapter = adapter;
  }

  @GetMapping(Mappings.PROTOCOL_PATH)
  public Collection<Importer> getProtocols() {
    return adapter.getAllProtocols();
  }
}
