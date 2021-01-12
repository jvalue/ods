package org.jvalue.ods.adapterservice.datasource.repository;

import org.jvalue.ods.adapterservice.datasource.model.DataBlob;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DataBlobRepository extends CrudRepository<DataBlob, Long> {
}
