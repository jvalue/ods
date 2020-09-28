package org.jvalue.ods.apiConfigurationService.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jvalue.ods.apiConfigurationService.endpoint.ApiConfigurationService;
import org.jvalue.ods.apiConfigurationService.model.PipelineConfigDTO;
import org.jvalue.ods.apiConfigurationService.model.RemoteSchemaData;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RabbitMQConsumer {

  ObjectMapper mapper = new ObjectMapper();
  ApiConfigurationService apiConfigurationService;

  public RabbitMQConsumer(ApiConfigurationService configurationService){
    this.apiConfigurationService = configurationService;
  }
  @RabbitListener(queues = "storage-mq.pipeline-config")
  public void recievedMessage(String message) {
    System.out.println("Recieved Message From RabbitMQ: " + message);
//    try {
//      PipelineConfigDTO config = mapper.readValue(message, PipelineConfigDTO.class);
//      System.out.println(config.toString());
//      if(config.getDefaultAPI()){
//        try {
//          //wait for postgres db entry to be created
//          TimeUnit.SECONDS.sleep(5);
//          apiConfigurationService.createDefaultApiForTable(config.getPipelineId());
//        } catch (InterruptedException e) {
//          e.printStackTrace();
//        }
//      } else if (!config.getDefaultAPI()){
//        apiConfigurationService.deleteAPIForTable(config.getPipelineId());
//      }
//      for(RemoteSchemaData x: config.getRemoteSchemata()){
//        System.out.println("Create remote schemata " + x.toString());
//        apiConfigurationService.addRemoteSchema(config.getPipelineId(), x.getEndpoint());
//      }
//    } catch (JsonProcessingException e) {
//      e.printStackTrace();
//    }
  }
}
