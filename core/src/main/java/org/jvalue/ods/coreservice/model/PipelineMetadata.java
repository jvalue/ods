package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Objects;

@Embeddable
public class PipelineMetadata {

    @NotNull
    private String author;

    private String license;

    @NotNull
    private LocalDateTime creationTimestamp;

    //Constructor for JPA
    public PipelineMetadata() {
    }

    @JsonCreator
    public PipelineMetadata(
            @JsonProperty("author") String author,
            @JsonProperty("license") String license) {
        this.author = author;
        this.license = license;
        this.creationTimestamp = LocalDateTime.now();
    }

    public String getAuthor() {
        return author;
    }

    public String getLicense() {
        return license;
    }

    public LocalDateTime getCreationTimestamp() {
        return creationTimestamp;
    }

    @Override
    public String toString() {
        return "PipelineMetadata{" +
                "author='" + author + '\'' +
                ", license='" + license + '\'' +
                ", creationTimestamp=" + creationTimestamp +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PipelineMetadata that = (PipelineMetadata) o;
        return author.equals(that.author) &&
                Objects.equals(license, that.license) &&
                creationTimestamp.equals(that.creationTimestamp);
    }

    @Override
    public int hashCode() {
        return Objects.hash(author, license, creationTimestamp);
    }
}
