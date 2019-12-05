package org.jvalue.ods.coreservice.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.Objects;

@Entity
public class NotificationConfig {

    @Id
    @GeneratedValue
    private Long notificationId;

    @NotNull
    private String condition;

    @OneToOne(cascade = CascadeType.ALL)
    private NotificationParams params;

    //Constructor for JPA
    public NotificationConfig() {
    }

    public NotificationConfig(
            @JsonProperty(value = "condition", required = true) String condition,
            @JsonProperty(value = "params", required = true) NotificationParams params) {
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

    @JsonTypeInfo(
      use = JsonTypeInfo.Id.NAME,
      property = "type")
    @JsonSubTypes({
      @JsonSubTypes.Type(value = WebhookParams.class, name = "WEBHOOK"),
      @JsonSubTypes.Type(value = SlackParams.class, name = "SLACK"),
      @JsonSubTypes.Type(value = FirebaseParams.class, name = "FCM")
    })
    @Entity
    @Inheritance(strategy = InheritanceType.SINGLE_TABLE)
    @DiscriminatorColumn(name = "Notification_Type")
    public abstract static class NotificationParams {
      @Id
      @GeneratedValue
      @JsonIgnore
      protected Long paramsId; // necessary for persistence

      public WebhookParams asWebhook() {
        if(this instanceof WebhookParams) {
          return (WebhookParams) this;
        } else {
          throw new IllegalArgumentException("Wrong runtime class for NotificationParams, was " + this.getClass().getCanonicalName());
        }
      }
      public SlackParams asSlack() {
        if(this instanceof SlackParams) {
          return (SlackParams) this;
        } else {
          throw new IllegalArgumentException("Wrong runtime class for NotificationParams, was " + this.getClass().getCanonicalName());
        }
      }
      public FirebaseParams asFirebase() {
        if(this instanceof FirebaseParams) {
          return (FirebaseParams) this;
        } else {
          throw new IllegalArgumentException("Wrong runtime class for NotificationParams, was " + this.getClass().getCanonicalName());
        }
      }
    }

    @Entity
    @DiscriminatorValue("Webhook")
    public static class WebhookParams extends NotificationParams {
      private String url;

      public WebhookParams() { } // Default constructor for JPA

      public WebhookParams(@JsonProperty(value = "url", required = true) String url) {
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

    @Entity
    @DiscriminatorValue("Slack")
    public static class SlackParams extends NotificationParams {
      @NotNull private String workspaceId;
      @NotNull private String channelId;
      @NotNull private String secret;

      public SlackParams() { } // Default constructor for JPA

      public SlackParams(
        @JsonProperty(value = "workspaceId", required = true) String workspaceId,
        @JsonProperty(value = "channelId", required = true) String channelId,
        @JsonProperty(value = "secret", required = true) String secret) {
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

      @Override
      public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SlackParams that = (SlackParams) o;
        return Objects.equals(workspaceId, that.workspaceId) &&
          Objects.equals(channelId, that.channelId) &&
          Objects.equals(secret, that.secret);
      }

      @Override
      public int hashCode() {
        return Objects.hash(workspaceId, channelId, secret);
      }
    }

    @Entity
    @DiscriminatorValue("Firebase")
    public static class FirebaseParams extends NotificationParams {
      private String projectId;
      private String clientEmail;
      @Column(columnDefinition = "LONGTEXT")
      private String privateKey;
      private String topic;

      public FirebaseParams() { } // Default constructor for JPA

      public FirebaseParams(
        @JsonProperty(value = "projectId", required = true) String projectId,
        @JsonProperty(value = "clientEmail", required = true) String clientEmail,
        @JsonProperty(value = "privateKey", required = true) String privateKey,
        @JsonProperty(value = "topic", required = true) String topic) {
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
      public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FirebaseParams that = (FirebaseParams) o;
        return Objects.equals(projectId, that.projectId) &&
          Objects.equals(clientEmail, that.clientEmail) &&
          Objects.equals(privateKey, that.privateKey) &&
          Objects.equals(topic, that.topic);
      }

      @Override
      public int hashCode() {
        return Objects.hash(projectId, clientEmail, privateKey, topic);
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
