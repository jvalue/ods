package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;
import java.util.Date;
import java.util.Objects;

@Embeddable
public class DatasourceMetadata {

    @NotNull
    private String author;

    @NotNull
    private String displayName;

    private String license;
    private String description;

    @NotNull
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", locale = "UTC")
    private Date creationTimestamp;

    //Constructor for JPA
    private DatasourceMetadata() {
    }

    @JsonCreator
    public DatasourceMetadata(
            @JsonProperty("author") String author,
            @JsonProperty("license") String license,
            @JsonProperty("displayName") String displayName,
            @JsonProperty("description") String description) {
        this.author = author;
        this.license = license;
        this.displayName = displayName;
        this.description = description;
        this.creationTimestamp = new Date();
    }

    public String getAuthor() {
        return author;
    }

    public String getLicense() {
        return license;
    }

    public String getDescription() {
        return description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setCreationTimestamp(Date creationTimestamp) {
        this.creationTimestamp = creationTimestamp;
    }

    public Date getCreationTimestamp() {
        return creationTimestamp;
    }

    @Override
    public String toString() {
        return "PipelineMetadata{" +
                "displayName='" + displayName + '\'' +
                ", author='" + author + '\'' +
                ", license='" + license + '\'' +
                ", creationTimestamp=" + creationTimestamp.toGMTString() +
                ", description='" + description + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DatasourceMetadata that = (DatasourceMetadata) o;
        return Objects.equals(author, that.author) &&
                Objects.equals(license, that.license) &&
                Objects.equals(creationTimestamp, that.creationTimestamp) &&
                Objects.equals(displayName, that.displayName) &&
                Objects.equals(description, that.description);
    }


    @Override
    public int hashCode() {
        return Objects.hash(author, license, creationTimestamp, displayName, description);
    }
}
