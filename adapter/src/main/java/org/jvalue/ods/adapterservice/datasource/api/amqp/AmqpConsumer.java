package org.jvalue.ods.adapterservice.datasource.api.amqp;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jvalue.ods.adapterservice.datasource.DatasourceManager;
import org.jvalue.ods.adapterservice.datasource.model.DataImport;
import org.jvalue.ods.adapterservice.datasource.model.amqp.DatasourceImportTrigger;
import org.jvalue.ods.adapterservice.datasource.model.exceptions.DatasourceNotFoundException;
import org.jvalue.ods.adapterservice.datasource.validator.ValidationMetaData;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@AllArgsConstructor
public class AmqpConsumer {
  private final DatasourceManager datasourceManager;

  @RabbitListener(queues = "${adapter.amqp.datasource_import_trigger_queue}")
	public void receiveImportTrigger(DatasourceImportTrigger importTrigger)  {
    try {
      datasourceManager.getDatasource(importTrigger.getDatasourceId());
      DataImport.MetaData result = datasourceManager.trigger(importTrigger.getDatasourceId(), importTrigger.getRuntimeParameters());
      // check result and log on error
      if(result.getHealth() != ValidationMetaData.HealthStatus.OK) {
        log.warn("HealthStatus {} after trigger of datasource with id {}", result.getHealth(), importTrigger.getDatasourceId());
      }
      if(result.getErrorMessages().length > 0) {
        log.error("Error during datasource trigger of datasource with id {}", importTrigger.getDatasourceId());
        for (String errrorMessage : result.getErrorMessages()) {
          log.error(errrorMessage);
        }
      }
    } catch (DatasourceNotFoundException e) {
      log.warn("Tried to trigger non-existed datasource with id {}", importTrigger.getDatasourceId());
    } catch (Exception exception) {
      log.error("Failed datasource import trigger", exception);
    }
	}
}
