package org.jvalue.ods.adapterservice.adapter.interpreter;

import java.util.Objects;

public class InterpreterParameterDescription {
    private String name;
    private String description;
    private Class type;

    private InterpreterParameterDescription() {    }

    public InterpreterParameterDescription(String name, String description, Class type) {
        this.name = name;
        this.description = description;
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

    public Class getType() {
        return type;
    }

    public void setType(Class type) {
        this.type = type;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        InterpreterParameterDescription that = (InterpreterParameterDescription) o;
        return Objects.equals(name, that.name) &&
                Objects.equals(description, that.description) &&
                Objects.equals(type, that.type);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, description, type);
    }
}
