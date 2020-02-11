package org.jvalue.ods.coreservice.model.notification;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.Entity;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Entity
public class SlackNotification extends NotificationConfig {

  @NotNull private String workspaceId;
  @NotNull private String channelId;
  @NotNull private String secret;

  public SlackNotification(
    @JsonProperty(value = "condition", required = true) String condition,
    @JsonProperty(value = "workspaceId", required = true) @NotNull String workspaceId,
    @JsonProperty(value = "channelId", required = true) @NotNull String channelId,
    @JsonProperty(value = "secret", required = true) @NotNull String secret) {
    super(condition, NotificationType.SLACK);
    this.workspaceId = workspaceId;
    this.channelId = channelId;
    this.secret = secret;
  }

  public String getWorkspaceId() {
    return workspaceId;
  }

  public String getChannelId() {
    return channelId;
  }

  public String getSecret() {
    return secret;
  }

  public SlackNotification() {
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    if (!super.equals(o)) return false;
    SlackNotification that = (SlackNotification) o;
    return Objects.equals(workspaceId, that.workspaceId) &&
      Objects.equals(channelId, that.channelId) &&
      Objects.equals(secret, that.secret);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), workspaceId, channelId, secret);
  }
}
