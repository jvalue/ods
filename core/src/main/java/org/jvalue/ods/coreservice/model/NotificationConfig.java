package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

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
    private String condition;

    @NotNull
    private NotificationParams params;

    @JsonTypeInfo(
      use = JsonTypeInfo.Id.NAME,
      property = "type")
    @JsonSubTypes({
      @JsonSubTypes.Type(value = WebhookParams.class, name = "WEBHOOK")
    })
    public static class NotificationParams {
      public WebhookParams asWebhook() {
        if(this instanceof WebhookParams) {
          return (WebhookParams) this;
        } else {
          throw new IllegalArgumentException("Wrong runtime class for NotificationParams, was " + this.getClass().getCanonicalName());
        }
      }
    }

    //Constructor for JPA
    public NotificationConfig() {
    }

    public NotificationConfig(
            @JsonProperty("condition") String condition,
            @JsonProperty("params") NotificationParams params) {
        this.condition = condition;
        this.params = params;
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

    public NotificationParams getParams() {
      return params;
    }

    public static class WebhookParams extends NotificationParams {
      private final String url;

      public WebhookParams(@JsonProperty("url") String url) {
        this.url = url;
      }

      public String getUrl() {
        return url;
      }

      @Override
      public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WebhookParams that = (WebhookParams) o;
        return Objects.equals(url, that.url);
      }

      @Override
      public int hashCode() {
        return Objects.hash(url);
      }
    }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    NotificationConfig that = (NotificationConfig) o;
    return Objects.equals(notificationId, that.notificationId) &&
      Objects.equals(condition, that.condition) &&
      Objects.equals(params, that.params);
  }

  @Override
  public int hashCode() {
    return Objects.hash(notificationId, condition, params);
  }
}
