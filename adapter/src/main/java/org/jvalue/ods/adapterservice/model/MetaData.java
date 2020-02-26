package org.jvalue.ods.adapterservice.model;

import javax.persistence.Embeddable;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class MetaData implements Serializable {

    public MetaData() {
    }

    @GeneratedValue
    @Id
    private Long id;

    public Long getId() {
        return id;
    }



    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MetaData metaData = (MetaData) o;
        return Objects.equals(id, metaData.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
