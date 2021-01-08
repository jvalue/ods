package org.jvalue.ods.adapterservice.adapter.importer;

import java.util.Objects;

public class ImporterParameterDescription {
  private String name;
  private String description;
  private boolean required;
  private Class<?> type;

  public ImporterParameterDescription(String name, String description, Class<?> type) {
    this.name = name;
    this.description = description;
    this.required = true;
    this.type = type;
  }

  public ImporterParameterDescription(String name, String description, boolean required, Class<?> type) {
    this.name = name;
    this.description = description;
    this.required = required;
    this.type = type;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Class<?> getType() {
    return type;
  }

  public void setType(Class<?> type) {
    this.type = type;
  }

  public boolean isRequired() {
    return required;
  }

  public void setRequired(boolean required) {
    this.required = required;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof ImporterParameterDescription)) return false;
    ImporterParameterDescription that = (ImporterParameterDescription) o;
    return isRequired() == that.isRequired() &&
      Objects.equals(getName(), that.getName()) &&
      Objects.equals(getDescription(), that.getDescription()) &&
      Objects.equals(getType(), that.getType());
  }

  @Override
  public int hashCode() {
    return Objects.hash(getName(), getDescription(), isRequired(), getType());
  }
}
