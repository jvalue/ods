package org.jvalue.ods.apiConfigurationService.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jvalue.ods.apiConfigurationService.endpoint.ApiConfigurationService;
import org.jvalue.ods.apiConfigurationService.model.PipelineConfigDTO;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RabbitMQConsumer {

  ObjectMapper mapper = new ObjectMapper();

  @RabbitListener(queues = "storage-mq.pipeline-config")
  public void recievedMessage(String message) {
    System.out.println("Recieved Message From RabbitMQ: " + message);
    try {
      PipelineConfigDTO config = mapper.readValue(message, PipelineConfigDTO.class);
      System.out.println(config.toString());
      if(config.getDefaultAPI()){
        try {
          //wait for postgres db entry to be created
          TimeUnit.SECONDS.sleep(5);
          new ApiConfigurationService().createDefaultApiForTable(config.getPipelineId());
        } catch (InterruptedException e) {
          e.printStackTrace();
        }
      } else if (!config.getDefaultAPI()){
        new ApiConfigurationService().deleteAPIForTable(config.getPipelineId());
      }
    } catch (JsonProcessingException e) {
      e.printStackTrace();
    }
  }
}
