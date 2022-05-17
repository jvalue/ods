import { AmqpChannel, AmqpConnection } from '@jvalue/node-dry-amqp';
import { ConsumeMessage } from 'amqplib';

import { ImporterParameterError } from '../../../adapter/model/exceptions/ImporterParameterError';
import {
  ADAPTER_AMQP_ADAPTER_EXCHANGE,
  ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE,
  ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE_TOPIC,
  ADAPTER_AMQP_IMPORT_FAILED_TOPIC,
} from '../../../env';
import { OutboxRepository } from '../../repository/outboxRepository';
import { DataImportTriggerService } from '../../services/dataImportTriggerService';
import { ErrorResponse } from '../../services/ErrorResponse';

export async function createDataSourceAmqpConsumer(
  amqpConnection: AmqpConnection,
): Promise<AmqpConsumer> {
  const channel = await amqpConnection.createChannel();
  const amqpConsumer = new AmqpConsumer(channel);
  await amqpConsumer.init();
  return amqpConsumer;
}

const outboxRepository: OutboxRepository = new OutboxRepository();

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

  escapeRegExp(str: string): string {
    // eslint-disable-next-line no-useless-escape
    return str.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, '\\$&');
  }

  fuzzyComparison(str: string, mask: string): boolean {
    const regex = '^' + this.escapeRegExp(mask).replace(/\*/, '.*') + '$';
    const r = new RegExp(regex);
    return r.test(str);
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
      this.fuzzyComparison(
        msg.fields.routingKey,
        ADAPTER_AMQP_DATASOURCE_IMPORT_TRIGGER_QUEUE_TOPIC,
      )
    ) {
      const stringContent: string = msg.content.toString();
      const msgContent: DataSourceAmqpMessageContent = JSON.parse(
        stringContent,
      ) as DataSourceAmqpMessageContent;
      const dataImportTriggerService: DataImportTriggerService =
        new DataImportTriggerService(
          msgContent.datasourceId.toString(),
          msgContent.runtimeParameters,
        );
      try {
        await dataImportTriggerService.triggerImport(msgContent.datasourceId);
      } catch (e) {
        if (e instanceof ImporterParameterError) {
          const msg: ErrorResponse = {
            error: 'URI is not absolute',
          };
          void outboxRepository.publishError(
            msgContent.datasourceId,
            ADAPTER_AMQP_IMPORT_FAILED_TOPIC,
            msg,
          );
          return;
        }
        if (e instanceof Error) {
          const msg: ErrorResponse = {
            error: '404 Not Found: [404 NOT FOUND Error]',
          };
          if (e.message.includes('Could not Fetch from URI:')) {
            void outboxRepository.publishError(
              msgContent.datasourceId,
              ADAPTER_AMQP_IMPORT_FAILED_TOPIC,
              msg,
            );
          }
          return;
        }
      }
    }
    await this.amqpChannel.ack(msg);
  };
}
export interface DataSourceAmqpMessageContent {
  datasourceId: number;
  runtimeParameters: Record<string, unknown>;
}
