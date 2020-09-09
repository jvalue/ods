package org.jvalue.ods.apiConfigurationService.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jvalue.ods.apiConfigurationService.endpoint.ApiConfigurationService;
import org.jvalue.ods.apiConfigurationService.model.PipelineConfingDTO;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class RabbitMQConsumer {

  ObjectMapper mapper = new ObjectMapper();

  @RabbitListener(queues = "storage-mq.pipeline-config")
  public void recievedMessage(String message) {
    System.out.println("Recieved Message From RabbitMQ: " + message);
    try {
      PipelineConfingDTO config = mapper.readValue(message, PipelineConfingDTO.class);
      System.out.println(config.toString());
      if(config.getDefaultAPI()){
        new ApiConfigurationService().createDefaultApiForTable(config.getPipelineId());
      } else if (!config.getDefaultAPI()){
        new ApiConfigurationService().deleteAPIForTable(config.getPipelineId());
      }
    } catch (JsonProcessingException e) {
      e.printStackTrace();
    }
  }
}
