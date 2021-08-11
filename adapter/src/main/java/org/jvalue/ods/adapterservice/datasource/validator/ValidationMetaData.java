package org.jvalue.ods.adapterservice.datasource.validator;

import lombok.*;

@Getter
@Setter
public class ValidationMetaData {
  private HealthStatus healthStatus;
  private String[] errorMessages;

  public ValidationMetaData(HealthStatus healthStatus) {
    this(healthStatus, new String[]{});
  }

  public ValidationMetaData(HealthStatus healthStatus, String[] errorMessages) {
    this.healthStatus = healthStatus;
    this.errorMessages = errorMessages;
  }

  public static enum HealthStatus {
    OK {
      public String toString() {
        return "OK";
      }
    },
    WARNING {
      public String toString() {
        return "WARNING";
      }
    },
    FAILED {
      public String toString() {
        return "FAILED";
      }
    }
  }
}
