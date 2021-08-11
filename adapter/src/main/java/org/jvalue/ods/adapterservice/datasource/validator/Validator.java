package org.jvalue.ods.adapterservice.datasource.validator;

import org.jvalue.ods.adapterservice.datasource.model.*;

public interface Validator {
    public ValidationMetaData validate(DataImport dataImport);
}

