package org.jvalue.ods.coreservice.model.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "Notification_Type")
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "type"
)
@JsonSubTypes({
  @JsonSubTypes.Type(value = WebhookNotification.class, name = "WEBHOOK"),
  @JsonSubTypes.Type(value = SlackNotification.class, name = "SLACK"),
  @JsonSubTypes.Type(value = FirebaseNotification.class, name = "FCM")
})
public abstract class NotificationConfig {

  @Id
  @GeneratedValue
  private Long notificationId;

  @NotNull
  @Column(length = 10000)
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
