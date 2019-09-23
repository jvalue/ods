package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Entity
public class NotificationConfig {

    @Id
    @GeneratedValue
    private Long notificationId;

    @NotNull
    private NotificationType notificationType;

    @NotNull
    private String condition;

    @NotNull
    private String url;


    //Constructor for JPA
    public NotificationConfig() {
    }

    public NotificationConfig(
            @JsonProperty("notificationType") NotificationType notificationType,
            @JsonProperty("condition") String condition,
            @JsonProperty("url") String url) {
        this.notificationType = notificationType;
        this.condition = condition;
        this.url = url;
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public NotificationType getNotificationType() {
        return notificationType;
    }

    public String getCondition() {
        return condition;
    }

    public String getUrl() {
        return url;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        NotificationConfig that = (NotificationConfig) o;
        return Objects.equals(notificationType, that.notificationType) &&
                Objects.equals(condition, that.condition) &&
                Objects.equals(url, that.url);
    }

    @Override
    public int hashCode() {
        return Objects.hash(notificationType, condition, url);
    }
}
