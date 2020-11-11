package org.jvalue.ods.adapterservice.datasource;

import org.jvalue.ods.adapterservice.adapter.Format;
import org.jvalue.ods.adapterservice.adapter.ProtocolEnum;
import org.jvalue.ods.adapterservice.datasource.model.*;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Map;

public class TestHelper {

  public static Datasource generateDatasource(ProtocolEnum protocol, Format format, String location) throws ParseException {
    DatasourceProtocol protocolConfig = new DatasourceProtocol(protocol, Map.of("location", location));
    DatasourceFormat formatConfig = new DatasourceFormat(format, Map.of());
    DatasourceMetadata metadata = new DatasourceMetadata("icke", "none", "TestName", "Describing...");
    DatasourceTrigger trigger = new DatasourceTrigger(
            true,
            new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").parse("1905-12-01T02:30:00.123Z"),
            50000L);
    return new Datasource(protocolConfig, formatConfig, metadata, trigger);
  }

  public static Datasource generateParameterizableDatasource(
          ProtocolEnum protocol,
          Format format,
          String location,
          Map<String, String> defaultParameters) throws ParseException {
    DatasourceProtocol protocolConfig = new DatasourceProtocol(
            protocol,
            Map.of("location", location, "defaultParameters", defaultParameters));
    DatasourceFormat formatConfig = new DatasourceFormat(format, Map.of());
    DatasourceMetadata metadata = new DatasourceMetadata(
            "icke",
            "none",
            "TestName",
            "Describing...");
    DatasourceTrigger trigger = new DatasourceTrigger(
            true,
            new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").parse("1905-12-01T02:30:00.123Z"),
            50000L);
    return new Datasource(protocolConfig, formatConfig, metadata, trigger);
  }
}
