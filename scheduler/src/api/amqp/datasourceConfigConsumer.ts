import * as AMQP from 'amqplib'
import { AmqpConsumer } from '@jvalue/node-dry-amqp'

import Scheduler from '../../scheduling'
import DatasourceConfig from '../datasource-config'

import {
  AMQP_URL,
  AMQP_SCHEDULER_EXCHANGE,
  AMQP_SCHEDULER_QUEUE,
  AMQP_DATASOURCE_CONFIG_TOPIC,
  AMQP_DATASOURCE_CONFIG_CREATED_TOPIC,
  AMQP_DATASOURCE_CONFIG_DELETED_TOPIC,
  AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC
} from '../../env'

export class DatasourceConfigConsumer {
  private readonly consumer = new AmqpConsumer()

  constructor (private readonly scheduler: Scheduler) {
  }

  public async initialize (retries: number, backoff: number): Promise<void> {
    await this.consumer.init(AMQP_URL, retries, backoff)

    const exchange = { name: AMQP_SCHEDULER_EXCHANGE, type: 'topic' }
    const exchangeOptions = {}
    const queue = { name: AMQP_SCHEDULER_QUEUE, routingKey: AMQP_DATASOURCE_CONFIG_TOPIC }
    const queueOptions = {
      exclusive: false
    }
    await this.consumer.registerConsumer(exchange, exchangeOptions, queue, queueOptions, this.consumeEvent)
  }

  private readonly consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (msg === null) {
      console.debug('Received empty event when listening on datasource config events - doing nothing')
    } else {
      await this.handleMsg(msg)
    }
  }

  private readonly handleMsg = async (msg: AMQP.ConsumeMessage): Promise<void> => {
    if (isUpdateOrCreate(msg)) {
      const event: DatasourceConfigEvent = JSON.parse(msg.content.toString())
      const datasource = event.datasource
      datasource.trigger.firstExecution = new Date(event.datasource.trigger.firstExecution)
      this.scheduler.upsertJob(datasource)
      return
    }

    if (isDelete(msg)) {
      const datasourceEvent: DatasourceConfigEvent = JSON.parse(msg.content.toString())
      this.scheduler.removeJob(datasourceEvent.datasource.id)
      return
    }

    console.debug('Received unsubscribed event on topic %s - doing nothing', msg.fields.routingKey)
  }
}

const isUpdateOrCreate = (msg: AMQP.ConsumeMessage): boolean => {
  return msg.fields.routingKey === AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC ||
      msg.fields.routingKey === AMQP_DATASOURCE_CONFIG_CREATED_TOPIC
}

const isDelete = (msg: AMQP.ConsumeMessage): boolean => {
  return msg.fields.routingKey === AMQP_DATASOURCE_CONFIG_DELETED_TOPIC
}

export interface DatasourceConfigEvent {
  datasource: DatasourceConfig
}
