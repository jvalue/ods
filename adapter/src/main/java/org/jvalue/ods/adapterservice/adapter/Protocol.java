package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.adapter.importer.HttpImporter;
import org.jvalue.ods.adapterservice.adapter.importer.Importer;
import org.springframework.web.client.RestTemplate;

public enum Protocol {
  HTTP(new HttpImporter(new RestTemplate()));

  private final Importer importer;
  Protocol(Importer importer) {
    this.importer = importer;
  }

  Importer getImporter() {
    return importer;
  }
}
