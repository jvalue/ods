package org.jvalue.ods.adapterservice.datasource.repository;

import org.jvalue.ods.adapterservice.datasource.event.DatasourceEvent;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import javax.validation.constraints.NotNull;

@Repository
public interface DatasourceEventRepository extends CrudRepository<DatasourceEvent, Long> {

    Iterable<DatasourceEvent> getAllByDatasourceIdAndEventIdAfter(@NotNull Long datasourceId, @NotNull Long after);

    Iterable<DatasourceEvent> getAllByEventIdAfter(@NotNull Long eventId);

  DatasourceEvent findFirstByOrderByEventIdDesc();
}
