package org.jvalue.ods.adapterservice.datasource.model;

import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;

import javax.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "outbox")
@TypeDefs({@TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)})
public class OutboxEvent {

  @Id
  @Column(name = "id", nullable = false)
  @GeneratedValue(strategy = GenerationType.AUTO)
  private UUID id;

  @Column(name = "routing_key", nullable = false)
  private String routingKey;

  @Type(type = "jsonb")
  @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
  private Object payload;

  // Constructor for JPA
  public OutboxEvent() {
  }

  public OutboxEvent(String routingKey, Object payload) {
    this.routingKey = routingKey;
    this.payload = payload;
  }
}
