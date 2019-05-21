package org.jvalue.ods.adapterservice.importer;

import org.jvalue.ods.adapterservice.models.RawData;

public abstract class Importer {
    public abstract RawData fetch();
}
