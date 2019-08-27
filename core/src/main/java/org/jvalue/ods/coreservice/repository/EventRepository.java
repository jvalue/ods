package org.jvalue.ods.coreservice.repository;

import org.jvalue.ods.coreservice.model.PipelineEvent;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import javax.validation.constraints.NotNull;

@Repository
public interface EventRepository extends CrudRepository<PipelineEvent, Long> {

    Iterable<PipelineEvent> getAllByPipelineId(@NotNull Long pipelineId);

    Iterable<PipelineEvent> getAllByEventIdAfter(@NotNull Long eventId);

    PipelineEvent findFirstByOrderByEventIdDesc();
}
