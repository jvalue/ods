package org.jvalue.ods.adapterservice.importer;

import java.util.Map;

public abstract class Importer {

    public abstract String getType();
    public abstract String getDescription();
    public abstract String fetch(Map<String, Object> parameters);
}
