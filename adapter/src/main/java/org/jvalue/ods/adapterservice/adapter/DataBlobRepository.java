package org.jvalue.ods.adapterservice.adapter;

import org.jvalue.ods.adapterservice.adapter.model.DataBlob;
import org.springframework.data.repository.CrudRepository;

public interface DataBlobRepository extends CrudRepository<DataBlob, Long> {
}
