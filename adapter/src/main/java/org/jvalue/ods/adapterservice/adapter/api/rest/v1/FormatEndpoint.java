package org.jvalue.ods.adapterservice.adapter.api.rest.v1;

import lombok.AllArgsConstructor;
import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
@AllArgsConstructor
public class FormatEndpoint {
  private final Adapter adapter;

  @GetMapping(Mappings.FORMAT_PATH)
  public Collection<Interpreter> getFormats() {
    return adapter.getAllFormats();
  }
}
