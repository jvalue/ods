package org.jvalue.ods.adapterservice.adapter.model.exceptions;

import lombok.NoArgsConstructor;

@NoArgsConstructor
public class AdapterException extends Exception {
  public AdapterException(String message) {
    super(message);
  }
}
