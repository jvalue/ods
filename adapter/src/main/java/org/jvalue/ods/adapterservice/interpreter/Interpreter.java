package org.jvalue.ods.adapterservice.interpreter;

import com.fasterxml.jackson.databind.JsonNode;
import org.jvalue.ods.adapterservice.models.RawData;

public abstract class Interpreter {
    public abstract JsonNode interpret(RawData fetch);
}
