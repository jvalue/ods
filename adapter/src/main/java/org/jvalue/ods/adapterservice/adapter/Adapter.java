package org.jvalue.ods.adapterservice.adapter;

import com.fasterxml.jackson.databind.JsonNode;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.jvalue.ods.adapterservice.adapter.interpreter.Interpreter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataImportResponse;
import org.jvalue.ods.adapterservice.datasource.model.DataBlob;
import org.jvalue.ods.adapterservice.adapter.model.FormatConfig;
import org.jvalue.ods.adapterservice.adapter.model.ProtocolConfig;
import org.jvalue.ods.adapterservice.datasource.repository.DataBlobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

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
  public DataImportResponse executeJob(AdapterConfig config) throws IllegalArgumentException, RestClientException {
    var rawData = this.executeProtocol(config.protocolConfig);
    var result = this.executeFormat(rawData, config.formatConfig);
    return new DataImportResponse(result.toString());
  }

  public DataBlob executeRawImport(ProtocolConfig config) {
    var rawData = this.executeProtocol(config);

    return dataBlobRepository.save(new DataBlob(rawData));
  }

  public String executeProtocol(ProtocolConfig config) {
    var importer = config.protocol.getImporter();
    try {
      return importer.fetch(config.parameters);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid protocol parameters", e);
    } catch (RestClientException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to load data: ", e);
    }
  }

  public JsonNode executeFormat(String rawData, FormatConfig config) {
    var interpreter = config.format.getInterpreter();
    try {
      return interpreter.interpret(rawData, config.parameters);
    } catch (IOException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not able to parse data as format: " + config.format, e);
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not interpret data", e);
    }
  }

  public Collection<Importer> getAllProtocols() {
    return Arrays.stream(Protocol.values()).map(Protocol::getImporter).collect(Collectors.toList());
  }

  public Collection<Interpreter> getAllFormats() {
    return Arrays.stream(Format.values()).map(Format::getInterpreter).collect(Collectors.toList());
  }
}
