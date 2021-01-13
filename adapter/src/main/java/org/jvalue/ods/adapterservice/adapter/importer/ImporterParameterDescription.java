package org.jvalue.ods.adapterservice.adapter.importer;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode
@AllArgsConstructor
public class ImporterParameterDescription {
  private String name;
  private String description;
  private boolean required;
  private Class<?> type;

  public ImporterParameterDescription(String name, String description, Class<?> type) {
    this(name, description, true, type);
  }
}
