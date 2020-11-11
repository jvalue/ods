package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.adapter.importer.Importer;

public interface Protocol {
    Importer getImporter();
}
