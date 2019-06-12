package org.jvalue.ods.adapterservice.importer;

import java.net.URI;
import java.util.Collections;
import java.util.Map;

public abstract class Importer {
    public final Map<String, String> parameters = Collections.EMPTY_MAP;

    public abstract String getType();

    public abstract String getDescription();

    public abstract String fetch(URI from);
}
