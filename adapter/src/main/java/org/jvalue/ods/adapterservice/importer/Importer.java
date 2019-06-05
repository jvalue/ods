package org.jvalue.ods.adapterservice.importer;

import java.net.URI;

public abstract class Importer {
    public abstract Object fetch(URI from);
    public abstract String type();
}
