package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.stream.Collectors;

@Service
public class Adapter {
  private final DataBlobRepository dataBlobRepository;

  @Autowired
  public Adapter(DataBlobRepository dataBlobRepository) {
    this.dataBlobRepository = dataBlobRepository;
  }

  /**
   * Executes an adapter configuration
   *
   * @param config the adapter configuration
   * @return the imported and interpreted data
   * @throws IllegalArgumentException on errors in the adapter config (e.g. missing parameters, ...)
   * @throws RestClientException      on response errors when importing the data
   */
  public DataBlob executeJob(AdapterConfig config) throws IllegalArgumentException, RestClientException {
    var importer = config.protocolConfig.protocol.getImporter();
    var interpreter = config.formatConfig.format.getInterpreter();

    try {
      var rawData = importer.fetch(config.protocolConfig.parameters);
      var result = interpreter.interpret(rawData, config.formatConfig.parameters);
      return dataBlobRepository.save(new DataBlob(result));
    } catch (IOException e) {
      throw new IllegalArgumentException("Not able to parse data as format: " + config.formatConfig.format, e);
    }
  }

  public Collection<Importer> getAllProtocols() {
    return Arrays.stream(Protocol.values()).map(Protocol::getImporter).collect(Collectors.toList());
  }

  public Collection<Interpreter> getAllFormats() {
    return Arrays.stream(Format.values()).map(Format::getInterpreter).collect(Collectors.toList());
  }
}
