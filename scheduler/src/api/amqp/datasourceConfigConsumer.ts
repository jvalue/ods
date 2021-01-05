import * as AMQP from 'amqplib'
import * as AmqpConnector from '@jvalue/node-dry-amqp/dist/amqpConnector'
import { sleep } from '@jvalue/node-dry-basics'

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
  private connection?: AMQP.Connection
  private channel?: AMQP.Channel

  constructor (private readonly scheduler: Scheduler) {
  }

  public async initialize (retries: number, backoff: number): Promise<void> {
    for (let i = 1; i <= retries; i++) {
      try {
        this.connection = await AmqpConnector.connect(AMQP_URL)
        break
      } catch (error) {
        console.info(`Error initializing the AMQP Client (${i}/${retries}):
        ${error}. Retrying in ${backoff}...`)
      }
      await sleep(backoff)
    }

    if (this.connection === undefined) {
      throw new Error(`Could not connect to AMQP broker at ${AMQP_URL}`)
    }

    const exchange = { name: AMQP_SCHEDULER_EXCHANGE, type: 'topic' }
    const exchangeOptions = {}
    const queue = { name: AMQP_SCHEDULER_QUEUE, routingKey: AMQP_DATASOURCE_CONFIG_TOPIC }
    const queueOptions = {
      exclusive: false
    }

    this.channel = await AmqpConnector.initChannel(this.connection, exchange, exchangeOptions)

    await this.channel.assertQueue(queue.name, queueOptions)
    await this.channel.bindQueue(queue.name, exchange.name, queue.routingKey)
  }

  public async startEventConsumption (): Promise<void> {
    if (this.channel === undefined) {
      throw new Error('Missing channel, AMQP client not initialized')
    }

    await this.channel.consume(AMQP_SCHEDULER_QUEUE, msg => {
      this.consumeEvent(msg)
        .catch(error => console.error(`Failed to handle ${msg?.fields.routingKey ?? 'null'} event`, error))
    })
  }

  private readonly consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (msg === null) {
      console.debug('Received empty event when listening on datasource config events - doing nothing')
      return
    }

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
