package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.adapter.importer.HttpImporter;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.springframework.web.client.RestTemplate;

public enum ProtocolEnum implements Protocol {
  HTTP(new HttpImporter(new RestTemplate()));

  private final Importer importer;
  ProtocolEnum(Importer importer) {
    this.importer = importer;
  }

  public Importer getImporter() {
    return importer;
  }
}
