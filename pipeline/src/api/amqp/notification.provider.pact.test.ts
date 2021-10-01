import * as AMQP from 'amqplib'
import path from 'path'
import * as EventPublisher from '../../pipeline-config/outboxEventPublisher'
import { MessageProviderPact } from '@pact-foundation/pact'
import { init } from '../../pipeline-config/pipelineDatabase'
import { AmqpConnection } from '@jvalue/node-dry-amqp'
import { AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC, AMQP_URL, CONNECTION_BACKOFF, CONNECTION_RETRIES } from '../../env'
import { readEnvOrDie } from '@jvalue/node-dry-basics'
import { PostgresClient } from '@jvalue/node-dry-pg'

const AMQP_PIPELINE_EXECUTION_EXCHANGE = readEnvOrDie('AMQP_PIPELINE_EXECUTION_EXCHANGE')
const AMQP_PIPELINE_EXECUTION_QUEUE = readEnvOrDie('AMQP_PIPELINE_EXECUTION_QUEUE')

describe('Pact Provider Verification', () => {
  const pact = new MessageProviderPact({
    provider: 'Provider Service',
    pactUrls: [
      path.resolve(process.cwd(), '..', 'pacts', 'notification-pipeline.json')
    ],
    logDir: path.resolve(process.cwd(), '..', 'pacts', 'logs'),
    stateHandlers: {
      'any state': async () => {}
    },
    messageProviders: {
      'a success event': provideSuccessEvent
    }
  })

  let pgClient: PostgresClient
  let amqpConnection: AmqpConnection

  const successMessages: unknown[] = []

  beforeAll(async () => {
    // setup amqp consumer to collect the messages that are published to the message-broker by the pipeline outboxer
    pgClient = await init(CONNECTION_RETRIES, CONNECTION_BACKOFF)

    amqpConnection = new AmqpConnection(AMQP_URL, CONNECTION_RETRIES, CONNECTION_BACKOFF,
      () => {
        console.error('lost connection to AMQP')
        process.exit(1)
      })
    const amqpChannel = await amqpConnection.createChannel()

    await amqpChannel.assertExchange(AMQP_PIPELINE_EXECUTION_EXCHANGE, 'topic')
    await amqpChannel.assertQueue(AMQP_PIPELINE_EXECUTION_QUEUE, { exclusive: false })
    await amqpChannel.bindQueue(
      AMQP_PIPELINE_EXECUTION_QUEUE, AMQP_PIPELINE_EXECUTION_EXCHANGE, AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC)

    await amqpChannel.consume(AMQP_PIPELINE_EXECUTION_QUEUE, async (msg: AMQP.ConsumeMessage | null): Promise<void> => {
      if (msg === null) {
        console.error('received an AMQP message that was null')
        process.exit(1)
      }
      if (msg.fields.routingKey === AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC) {
        successMessages.push(JSON.parse(msg.content.toString()))
      }
      await amqpChannel.ack(msg)
    })
  })

  it('validates the expectations of the notification service', async () => {
    return await pact.verify()
  })

  afterAll(async () => {
    await pgClient.close()
    await amqpConnection.close()
  })

  async function provideSuccessEvent (): Promise<unknown> {
    await pgClient.transaction(async client => {
      await EventPublisher.publishSuccess(
        client,
        1,
        'some pipeline name',
        {},
        { some: 'schema' }
      )
    })

    // wait until the message that will be published by the pipeline outboxer is collected
    while (successMessages.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    return successMessages.pop()
  }
})
