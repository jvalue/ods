package org.jvalue.ods.adapterservice.datasource.repository;

import org.jvalue.ods.adapterservice.datasource.model.OutboxEvent;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OutboxEventRepository extends CrudRepository<OutboxEvent, UUID> {
}
