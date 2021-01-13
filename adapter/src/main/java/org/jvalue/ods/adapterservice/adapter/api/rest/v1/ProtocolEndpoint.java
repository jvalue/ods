package org.jvalue.ods.adapterservice.adapter.api.rest.v1;

import lombok.AllArgsConstructor;
import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
@AllArgsConstructor
public class ProtocolEndpoint {
  private final Adapter adapter;

  @GetMapping(Mappings.PROTOCOL_PATH)
  public Collection<Importer> getProtocols() {
    return adapter.getAllProtocols();
  }
}
