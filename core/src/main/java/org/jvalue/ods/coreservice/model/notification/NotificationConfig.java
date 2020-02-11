package org.jvalue.ods.coreservice.model.notification;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Entity
public abstract class NotificationConfig {

  @Id
  @GeneratedValue
  private Long notificationId;

  @NotNull
  private String condition;

  private NotificationType type;

  //Constructor for JPA
  public NotificationConfig() {
  }

  public NotificationConfig(
    @JsonProperty(value = "condition", required = true) String condition,
    @JsonProperty(value = "type", required = true) NotificationType type) {
    this.condition = condition;
    this.type = type;
  }

  public Long getNotificationId() {
    return notificationId;
  }

  public void setNotificationId(Long notificationId) {
    this.notificationId = notificationId;
  }

  public String getCondition() {
    return condition;
  }

  public NotificationType getType() {
    return type;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    NotificationConfig that = (NotificationConfig) o;
    return Objects.equals(notificationId, that.notificationId) &&
      Objects.equals(condition, that.condition);
  }

  @Override
  public int hashCode() {
    return Objects.hash(notificationId, condition);
  }
}
