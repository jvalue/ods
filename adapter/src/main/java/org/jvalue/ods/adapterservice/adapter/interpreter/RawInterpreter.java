package org.jvalue.ods.adapterservice.adapter.interpreter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class RawInterpreter extends Interpreter {

    private final List<InterpreterParameterDescription> parameters = Collections.emptyList();

    @Override
    public String getType() {
        return "RAW";
    }

    @Override
    public String getDescription() {
        return "Do not change the original data format";
    }

    @Override
    public List<InterpreterParameterDescription> getAvailableParameters() {
        return parameters;
    }

    @Override
    protected String doInterpret(String data, Map<String, Object> parameters) throws IOException {
        return data;
    }
}
