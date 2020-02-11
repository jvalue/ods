package org.jvalue.ods.coreservice.model.notification;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Entity
@DiscriminatorValue("Firebase")
public class FirebaseNotification extends NotificationConfig {

  @NotNull private String projectId;
  @NotNull private String clientEmail;
  @NotNull private String privateKey;
  @NotNull private String topic;

  public FirebaseNotification() {
  }

  public FirebaseNotification(
    @JsonProperty(value = "condition", required = true) String condition,
    @JsonProperty(value = "projectId", required = true) String projectId,
    @JsonProperty(value = "clientEmail", required = true) @NotNull String clientEmail,
    @JsonProperty(value = "privateKey", required = true) @NotNull String privateKey,
    @JsonProperty(value = "topic", required = true) @NotNull String topic) {

    super(condition, NotificationType.FCM);
    this.projectId = projectId;
    this.clientEmail = clientEmail;
    this.privateKey = privateKey;
    this.topic = topic;
  }

  public String getProjectId() {
    return projectId;
  }

  public String getClientEmail() {
    return clientEmail;
  }

  public String getPrivateKey() {
    return privateKey;
  }

  public String getTopic() {
    return topic;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), projectId, clientEmail, privateKey, topic);
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    if (!super.equals(o)) return false;
    FirebaseNotification that = (FirebaseNotification) o;
    return Objects.equals(projectId, that.projectId) &&
      Objects.equals(clientEmail, that.clientEmail) &&
      Objects.equals(privateKey, that.privateKey) &&
      Objects.equals(topic, that.topic);
  }
}
