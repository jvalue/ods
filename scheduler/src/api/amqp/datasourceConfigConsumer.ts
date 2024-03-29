import { AmqpChannel, AmqpConnection } from '@jvalue/node-dry-amqp';
import * as AMQP from 'amqplib';

import {
  AMQP_DATASOURCE_CONFIG_CREATED_TOPIC,
  AMQP_DATASOURCE_CONFIG_DELETED_TOPIC,
  AMQP_DATASOURCE_CONFIG_TOPIC,
  AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC,
  AMQP_SCHEDULER_EXCHANGE,
  AMQP_SCHEDULER_QUEUE,
} from '../../env';
import Scheduler from '../../scheduling';
import DatasourceConfig from '../datasource-config';

export class DatasourceConfigConsumer {
  private channel?: AmqpChannel;

  constructor(
    private readonly connection: AmqpConnection,
    private readonly scheduler: Scheduler,
  ) {}

  async initialize(): Promise<void> {
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(AMQP_SCHEDULER_EXCHANGE, 'topic');
    await this.channel.assertQueue(AMQP_SCHEDULER_QUEUE, { exclusive: false });
    await this.channel.bindQueue(
      AMQP_SCHEDULER_QUEUE,
      AMQP_SCHEDULER_EXCHANGE,
      AMQP_DATASOURCE_CONFIG_TOPIC,
    );
  }

  async startEventConsumption(): Promise<void> {
    if (this.channel === undefined) {
      throw new Error('Missing channel, AMQP client not initialized');
    }

    await this.channel.consume(AMQP_SCHEDULER_QUEUE, this.consumeEvent);
  }

  private readonly consumeEvent = async (
    msg: AMQP.ConsumeMessage | null,
  ): Promise<void> => {
    if (msg == null) {
      console.debug(
        'Received empty event when listening on datasource config events - doing nothing',
      );
      return;
    }

    if (isUpdateOrCreate(msg)) {
      // eslint does not like 'const event: DatasourceConfigEvent = JSON.parse(...)' in combination with JSON.parse
      const event = JSON.parse(msg.content.toString()) as DatasourceConfigEvent;
      const datasource = event.datasource;
      datasource.trigger.firstExecution = new Date(
        event.datasource.trigger.firstExecution,
      );
      this.scheduler.upsertJob(datasource);
    } else if (isDelete(msg)) {
      const datasourceEvent = JSON.parse(
        msg.content.toString(),
      ) as DatasourceConfigEvent;
      this.scheduler.removeJob(datasourceEvent.datasource.id);
    } else {
      console.debug(
        'Received unsubscribed event on topic %s - doing nothing',
        msg.fields.routingKey,
      );
    }
    await this.channel?.ack(msg);
  };
}

const isUpdateOrCreate = (msg: AMQP.ConsumeMessage): boolean => {
  return (
    msg.fields.routingKey === AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC ||
    msg.fields.routingKey === AMQP_DATASOURCE_CONFIG_CREATED_TOPIC
  );
};

const isDelete = (msg: AMQP.ConsumeMessage): boolean => {
  return msg.fields.routingKey === AMQP_DATASOURCE_CONFIG_DELETED_TOPIC;
};

export interface DatasourceConfigEvent {
  datasource: DatasourceConfig;
}
