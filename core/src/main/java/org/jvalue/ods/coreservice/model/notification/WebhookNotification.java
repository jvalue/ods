package org.jvalue.ods.coreservice.model.notification;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.persistence.DiscriminatorValue;
import javax.persistence.Entity;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Entity
@DiscriminatorValue("Webhook")
public class WebhookNotification extends NotificationConfig {

  @NotNull private String url;

  public WebhookNotification() {
  }

  public WebhookNotification(
    @JsonProperty(value = "condition", required = true) String condition,
    @JsonProperty(value = "url", required = true) String url) {
    super(condition, NotificationType.WEBHOOK);
    this.url = url;
  }

  public String getUrl() {
    return url;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    if (!super.equals(o)) return false;
    WebhookNotification that = (WebhookNotification) o;
    return Objects.equals(url, that.url);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), url);
  }
}
