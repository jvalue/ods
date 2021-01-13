package org.jvalue.ods.adapterservice.adapter.interpreter;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class InterpreterParameterDescription {
  private String name;
  private String description;
  private Class<?> type;
}
