import { AmqpChannel, AmqpConnection } from '@jvalue/node-dry-amqp';
import { ConsumeMessage } from 'amqplib';

import {
  ADAPTER_AMQP_ADAPTER_EXCHANGE,
  ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE,
  ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE_TOPIC,
} from '../../../env';
import {DataSourceTriggerEvent} from "../../model/DataSourceTriggerEvent";
import {DataImportTriggerService} from "../../services/dataImportTriggerService";
export async function createDataSourceAmqpConsumer(
  amqpConnection: AmqpConnection,
): Promise<AmqpConsumer> {
  const channel = await amqpConnection.createChannel();
  const amqpConsumer = new AmqpConsumer(channel);
  await amqpConsumer.init();
  return amqpConsumer;
}



export class AmqpConsumer {
  constructor(private readonly amqpChannel: AmqpChannel) {}

  /** Initializes the datasource execution consumer */
  async init(): Promise<void> {
    await this.amqpChannel.assertExchange(
      ADAPTER_AMQP_ADAPTER_EXCHANGE,
      // 'ods_global',
      'topic',
    );
    await this.amqpChannel.assertQueue(
      ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE,
      // 'adapter.datasource-import-trigger'
      {
        exclusive: false,
      },
    );
    await this.amqpChannel.bindQueue(
      ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE,
      // 'adapter.datasource-import-trigger',
      ADAPTER_AMQP_ADAPTER_EXCHANGE,
      // 'ods_global',
      ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE_TOPIC,
      // 'datasource.import-trigger.*',
    );

    await this.amqpChannel.consume(
      ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE,
      // 'adapter.datasource-import-trigger',
      this.consumeEvent,
    );
  }

  // Use the f = () => {} syntax to access this
  consumeEvent = async (msg: ConsumeMessage | null): Promise<void> => {
    if (msg == null) {
      console.debug(
        'Received empty event when listening on datasource executions - doing nothing',
      );
      return;
    }
    if (
      msg.fields.routingKey === ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE_TOPIC
      // 'adapter.datasource-import-trigger'
    ) {
      // @ts-ignore TODO check warning
      let msgContent:DataSourceTriggerEvent = msg.content.toJSON();
      let dataImportTriggerService:DataImportTriggerService=new DataImportTriggerService(msgContent.datasourceId.toString(),msgContent.runtimeParameters);
      await dataImportTriggerService.triggerImport(msgContent.datasourceId);

      console.log('received' + msg);
    }
    await this.amqpChannel.ack(msg);
  };
}
