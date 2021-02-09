const waitOn = require('wait-on')
const request = require('supertest')
const { sleep } = require('@jvalue/node-dry-basics')
const AmqpConnector = require('@jvalue/node-dry-amqp/dist/amqpConnector')

const { STORAGE_URL, STORAGEMQ_URL, AMQP_URL } = require('./env')

const AMQP_EXCHANGE = 'ods_global'
const AMQP_PIPELINE_CONFIG_CREATED_TOPIC = 'pipeline.config.created'
const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = 'pipeline.execution.success'

const TIMEOUT = 10000
const PROCESS_TIME = 1000
const SECOND = 1000

let amqpConnection
const pipelineId = 21398

const pipelineCreatedEvent = {
  pipelineId: pipelineId
}
const pipelineCreatedEventBuf = Buffer.from(JSON.stringify(pipelineCreatedEvent))

const pipelineExecutedEvent = {
  pipelineId: pipelineId,
  timestamp: new Date(Date.now()),
  data: { exampleNumber: 123, exampleString: 'abc', exampleArray: [{ x: 'y' }, { t: 456 }] }
}
const pipelineExecutedEventBuf = Buffer.from(JSON.stringify(pipelineExecutedEvent))

describe('IT against Storage service', () => {
  beforeAll(async () => {
    logConfigs()

    try {
      const promiseResults = await Promise.all([
        AmqpConnector.connect(AMQP_URL, 40, 2000),
        waitOn({ resources: [STORAGE_URL, `${STORAGEMQ_URL}/`], timeout: 80 * SECOND, log: false })
      ])
      amqpConnection = promiseResults[0]
    } catch (err) {
      throw new Error('Error during setup of tests: ' + err)
    }
  }, 90 * SECOND)

  afterAll(async () => {
    await amqpConnection?.close()
  }, TIMEOUT)

  test('Should provide transformed data after successful pipeline event', async () => {
    const channel = await amqpConnection.createChannel()
    channel.assertExchange(AMQP_EXCHANGE, 'topic')

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, pipelineCreatedEventBuf)
    await sleep(PROCESS_TIME)

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC, pipelineExecutedEventBuf)
    await sleep(PROCESS_TIME)

    const response = await request(STORAGE_URL).get(`/${pipelineId}`)

    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')

    expect(response.body).toHaveLength(1)
    expect(response.body[0].id).toEqual(1)
    expect(response.body[0].pipelineId).toEqual(pipelineExecutedEvent.pipelineId)
    expect(response.body[0].data).toEqual(pipelineExecutedEvent.data)
    expect(new Date(response.body[0].timestamp)).toEqual(new Date(pipelineExecutedEvent.timestamp))
  }, TIMEOUT)
})

const logConfigs = () => {
  const msg = `
  AMQP_EXCHANGE: ${AMQP_EXCHANGE}
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC: ${AMQP_PIPELINE_CONFIG_CREATED_TOPIC}
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC: ${AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC}

  [Environment Variable] STORAGE_URL = ${STORAGE_URL}
  [Environment Variable] STORAGEMQ_URL = ${STORAGEMQ_URL}
  [Environment Variable] AMQP_URL = ${AMQP_URL}
  `
  console.log(msg)
}
