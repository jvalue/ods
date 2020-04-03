package org.jvalue.ods.adapterservice.adapter.interpreter;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.UntypedObjectDeserializer;

import java.io.IOException;
import java.util.*;

public class UntypedXMLArrayDeserializer extends UntypedObjectDeserializer {
  @Override
  protected Object mapObject(JsonParser p, DeserializationContext ctxt) throws IOException {
    // Method beginning is just copied from superclass.
    String key1;

    JsonToken t = p.getCurrentToken();

    if (t == JsonToken.START_OBJECT) {
      key1 = p.nextFieldName();
    } else if (t == JsonToken.FIELD_NAME) {
      key1 = p.getCurrentName();
    } else {
      if (t != JsonToken.END_OBJECT) {
        return ctxt.handleUnexpectedToken(handledType(), p);
      }
      key1 = null;
    }
    if (key1 == null) {
      // empty map might work; but caller may want to modify... so better just give small modifiable
      return new LinkedHashMap<String,Object>(2);
    }

    Map<String, Object> result = new LinkedHashMap<>();

    p.nextToken();
    result.put(key1, deserialize(p, ctxt));

    /*
      Adaptations to the superclass start here.
      Inspired by: https://gist.github.com/joaovarandas/1543e792ed6204f0cf5fe860cb7d58ed
     */
    while ((key1 = p.nextFieldName()) != null ) {
      p.nextToken();
      Object val = result.get(key1);
      if(result.containsKey(key1)) { // key is not unique -> consider it as a list.
        if(!(val instanceof List)) {
          val = new ArrayList<>();
          ((List) val).add(result.get(key1));
          result.put(key1, val);
        }

        ((List) val).add(deserialize(p, ctxt));
      } else {
        result.put(key1, deserialize(p, ctxt));
      }
    }

    return result;
  }
}
