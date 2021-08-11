package org.jvalue.ods.adapterservice.adapter;

import com.fasterxml.jackson.databind.JsonNode;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataImportResponse;
import org.jvalue.ods.adapterservice.adapter.model.FormatConfig;
import org.jvalue.ods.adapterservice.adapter.model.ProtocolConfig;
import org.jvalue.ods.adapterservice.adapter.model.exceptions.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.stream.Collectors;

@Service
public class Adapter {

  /**
   * Executes an adapter configuration
   *
   * @param config the adapter configuration
   * @return the imported and interpreted data
   * @throws ImporterParameterException    on errors in the interpreter config (e.g. missing parameters, ...)
   * @throws InterpreterParameterException on errors in the interpreter config (e.g. missing parameters, ...)
   * @throws IOException                   on response errors when importing the data
   */
  public DataImportResponse executeJob(AdapterConfig config) throws ImporterParameterException, InterpreterParameterException, IOException {
    var rawData = this.executeProtocol(config.protocolConfig);
    var result = this.executeFormat(rawData, config.formatConfig);
    return new DataImportResponse(result.toString());
  }

  public DataImportResponse executeRawImport(ProtocolConfig config) throws ImporterParameterException {
    var rawData = this.executeProtocol(config);
    return new DataImportResponse(rawData);
  }

  public String executeProtocol(ProtocolConfig config) throws ImporterParameterException {
    var importer = config.protocol.getImporter();
    return importer.fetch(config.parameters);
  }

  public JsonNode executeFormat(String rawData, FormatConfig config) throws InterpreterParameterException, IOException {
    var interpreter = config.format.getInterpreter();
    return interpreter.interpret(rawData, config.parameters);
  }

  public Collection<Importer> getAllProtocols() {
    return Arrays.stream(Protocol.values()).map(Protocol::getImporter).collect(Collectors.toList());
  }

  public Collection<Interpreter> getAllFormats() {
    return Arrays.stream(Format.values()).map(Format::getInterpreter).collect(Collectors.toList());
  }
}
