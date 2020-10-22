package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collection;
import java.util.stream.Collectors;

@Service
public class AdapterFactory {

  private final DataBlobRepository dataRepository;

  @Autowired
  public AdapterFactory(DataBlobRepository dataRepository) {
    this.dataRepository = dataRepository;
  }

  public Adapter getAdapter(AdapterConfig config) {
    Importer importer = config.protocolConfig.protocol.getImporter();
    Interpreter interpreter = config.formatConfig.format.getInterpreter();
    return new Adapter(importer, interpreter, dataRepository);
  }

  public Collection<Importer> getAllProtocols() {
    return Arrays.stream(Protocol.values()).map(Protocol::getImporter).collect(Collectors.toList());
  }

  public Collection<Interpreter> getAllFormats() {
    return Arrays.stream(Format.values()).map(Format::getInterpreter).collect(Collectors.toList());
  }
}
