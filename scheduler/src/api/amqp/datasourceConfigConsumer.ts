import * as AMQP from 'amqplib'

import { sleep } from '../../sleep'
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
import { stringify } from '../../logging'

export class DatasourceConfigConsumer {
  constructor (private readonly scheduler: Scheduler) {
  }

  public async initialize (retries: number, backoff: number): Promise<void> {
    console.log('AMQP URL: ' + AMQP_URL)
    for (let i = 1; i <= retries; i++) {
      try {
        const connection = await AMQP.connect(AMQP_URL)
        await this.initChannel(connection)
        return
      } catch (error) {
        if (i >= retries) {
          console.error(`Could not establish connection to AMQP Broker (${AMQP_URL})`)
          throw error
        }
        console.info(`Error connecting to RabbitMQ: ${error}. Retrying in ${backoff} seconds`)
        console.info(`Connecting to Amqp handler (${i}/${retries})`)
        await sleep(backoff)
      }
    }
  }

  private async initChannel (connection: AMQP.Connection): Promise<void> {
    console.log(`Initializing queue "${AMQP_SCHEDULER_QUEUE}"
      on exchange "${AMQP_SCHEDULER_EXCHANGE}" with topic "${AMQP_DATASOURCE_CONFIG_TOPIC}"`)

    const channel = await connection.createChannel()

    await channel.assertExchange(AMQP_SCHEDULER_EXCHANGE, 'topic')

    const q = await channel.assertQueue(AMQP_SCHEDULER_QUEUE, {
      exclusive: false
    })
    await channel.bindQueue(q.queue, AMQP_SCHEDULER_EXCHANGE, AMQP_DATASOURCE_CONFIG_TOPIC)

    await channel.consume(q.queue, msg => {
      this.consumeEvent(msg)
        .catch(error => console.error(`Failed to handle ${msg?.fields.routingKey ?? 'null'} event`, error))
    })
    console.info('Successfully initialized AMQP queue')
  }

  consumeEvent = async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
    if (msg === null) {
      console.debug('Received empty event when listening on datasource config events - doing nothing')
    } else {
      await this.handleMsg(msg)
    }
  }

  handleMsg = async (msg: AMQP.ConsumeMessage): Promise<void> => {
    console.debug("[EventConsume] %s:'%s'", msg?.fields.routingKey, stringify(msg?.content.toString()))

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
