package org.jvalue.ods.adapterservice.adapter.amqp;

import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.AdapterFactory;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class AmqpReceiver {

  private final AdapterFactory adapterFactory;

  @Autowired
  public AmqpReceiver(AdapterFactory adapterFactory) {
    this.adapterFactory = adapterFactory;
  }

  public void consumeMessage(String message){
    // TODO: Convert message to AdapterConfig
    //    Adapter adapter = adapterFactory.getAdapter(config);
  //     adapter.executeJob(config)
  }
}
