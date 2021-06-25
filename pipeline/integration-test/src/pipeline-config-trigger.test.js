const { setTimeout: sleep } = require('timers/promises')

const { AmqpConnection } = require('@jvalue/node-dry-amqp')
const request = require('supertest')
const waitOn = require('wait-on')

const { consumeTopics } = require('./amqp-msg-consumer')

const URL = process.env.PIPELINE_API || 'http://localhost:8080'

const AMQP_URL = process.env.AMQP_URL
const AMQP_EXCHANGE = process.env.AMQP_EXCHANGE
const AMQP_IT_QUEUE = process.env.AMQP_IT_QUEUE
const AMQP_PIPELINE_EXECUTION_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_TOPIC
const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC
const AMQP_PIPELINE_EXECUTION_ERROR_TOPIC = process.env.AMQP_PIPELINE_EXECUTION_ERROR_TOPIC
const AMQP_IMPORT_SUCCESS_TOPIC = process.env.AMQP_IMPORT_SUCCESS_TOPIC
const CONNECTION_RETRIES = +process.env.CONNECTION_RETRIES
const CONNECTION_BACKOFF = +process.env.CONNECTION_BACKOFF
const PIPELINE_EXECUTION_WAIT_TIME_MS = +process.env.PIPELINE_EXECUTION_WAIT_TIME_MS

const TEST_TIMEOUT = 120000

let amqpConnection
let getPublishedEvent

describe('Pipeline Service Config Trigger', () => {
  beforeAll(async () => {
    console.log('Starting config trigger tests..')
    const pingUrl = URL + '/'
    await waitOn({ resources: [pingUrl], timeout: 50000, log: true })

    amqpConnection = new AmqpConnection(AMQP_URL, CONNECTION_RETRIES, CONNECTION_BACKOFF)
    getPublishedEvent = await consumeTopics(amqpConnection, AMQP_EXCHANGE, AMQP_IT_QUEUE, [AMQP_PIPELINE_EXECUTION_TOPIC])
  }, TEST_TIMEOUT)

  afterAll(async () => {
    await amqpConnection?.close()

    // clear stored configs
    await request(URL)
      .delete('/configs')
      .send()
  })

  test('Pipeline runs through successfully with successful publish', async () => {
    const pipelineConfig = {
      datasourceId: 12345,
      transformation: {
        func: 'return data.a + data.b;'
      },
      metadata: {
        author: 'icke',
        license: 'none',
        displayName: 'success test pipeline',
        description: 'integration testing pipeline'
      }
    }
    // create pipeline to persist
    const creationResponse = await request(URL)
      .post('/configs')
      .send(pipelineConfig)
    expect(creationResponse.status).toEqual(201)
    const configId = creationResponse.body.id

    const data = {
      a: 'abc',
      b: 123
    }

    const importSuccessEvent = {
      datasourceId: pipelineConfig.datasourceId,
      data: JSON.stringify(data)
    }

    await publish(AMQP_EXCHANGE, AMQP_IMPORT_SUCCESS_TOPIC, importSuccessEvent)

    await sleep(PIPELINE_EXECUTION_WAIT_TIME_MS) // pipeline should have been executing until now!
    expect(getPublishedEvent(AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC)).toContainEqual(
      {
        pipelineId: configId,
        pipelineName: pipelineConfig.metadata.displayName,
        data: data.a + data.b
      })
  }, TEST_TIMEOUT)

  test('Pipeline runs through with error with successful publish', async () => {
    const pipelineConfig = {
      datasourceId: 12346,
      transformation: {
        func: 'return asd.def;'
      },
      metadata: {
        author: 'icke',
        license: 'none',
        displayName: 'error test pipeline',
        description: 'integration testing pipeline'
      }
    }
    // create pipeline to persist
    const creationResponse = await request(URL)
      .post('/configs')
      .send(pipelineConfig)
    expect(creationResponse.status).toEqual(201)
    const configId = creationResponse.body.id

    const data = {
      a: 'abc',
      b: 123
    }

    const importSuccessEvent = {
      datasourceId: pipelineConfig.datasourceId,
      data: JSON.stringify(data)
    }

    await publish(AMQP_EXCHANGE, AMQP_IMPORT_SUCCESS_TOPIC, importSuccessEvent)

    await sleep(PIPELINE_EXECUTION_WAIT_TIME_MS) // pipeline should have been executing until now!
    expect(getPublishedEvent(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)).toBeDefined()
    expect(getPublishedEvent(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)).toHaveLength(1)
    expect(getPublishedEvent(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)[0].pipelineId).toEqual(configId)
    expect(getPublishedEvent(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)[0].pipelineName).toEqual(pipelineConfig.metadata.displayName)
    expect(getPublishedEvent(AMQP_PIPELINE_EXECUTION_ERROR_TOPIC)[0].error).toBeDefined()
  }, TEST_TIMEOUT)
})

async function publish (exchange, topic, content) {
  const channel = await amqpConnection.createChannel()
  await channel.publish(exchange, topic, Buffer.from(JSON.stringify(content)))
}
