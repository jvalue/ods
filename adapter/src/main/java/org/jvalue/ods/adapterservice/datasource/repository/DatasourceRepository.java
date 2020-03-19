package org.jvalue.ods.adapterservice.datasource.repository;

import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DatasourceRepository extends CrudRepository<Datasource, Long> {
}
