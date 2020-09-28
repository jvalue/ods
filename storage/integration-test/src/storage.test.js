const waitOn = require('wait-on')
const request = require('supertest')
const AMQP = require('amqplib')
const {
  STORAGE_URL,
  STORAGEMQ_URL,
  AMQP_URL
} = require('./env')

const AMQP_EXCHANGE = 'ods_global'
const AMQP_PIPELINE_CONFIG_CREATED_TOPIC = 'pipeline.config.created'
const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = 'pipeline.execution.success'

const TIMEOUT = 10000
const PROCESS_TIME = 1000

let amqpConnection
const pipelineId = '21398'

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

describe('Storage', () => {
  beforeAll(async () => {
    logAMQPConfig()
    try {
      const promiseResults = await Promise.all([
        amqpConnect(AMQP_URL, 40, 2000),
        waitOn({ resources: [STORAGE_URL, `${STORAGEMQ_URL}/`], timeout: 80000, log: true })
      ])
      amqpConnection = promiseResults[0]
    } catch (err) {
      process.exit(1)
    }
  }, 90000)

  afterAll(async () => {
    if (amqpConnection) {
      console.log('Closing AMQP connection...')
      await amqpConnection.close()
    }
  }, TIMEOUT)

  test('Should provide transformed data after successful pipeline event', async () => {
    const channel = await amqpConnection.createChannel()
    channel.assertExchange(AMQP_EXCHANGE, 'topic', {
      durable: true
    })

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

const logAMQPConfig = () => {
  console.log('AMQP_EXCHANGE: ', AMQP_EXCHANGE)
  console.log('AMQP_PIPELINE_CONFIG_CREATED_TOPIC: ', AMQP_PIPELINE_CONFIG_CREATED_TOPIC)
  console.log('AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC: ', AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC)
}

const amqpConnect = async (amqpUrl, retries, backoff) => {
  console.log('AMQP URL: ' + amqpUrl)
  for (let i = 1; i <= retries; i++) {
    try {
      const connection = await AMQP.connect(amqpUrl)
      console.log(`Successfully establish connection to AMQP broker (${amqpUrl})`)
      return connection
    } catch (error) {
      console.info(`Error connecting to RabbitMQ: ${error}. Retrying in ${backoff} seconds`)
      console.info(`Connecting to Amqp broker (${i}/${retries})`)
      await sleep(backoff)
    }
  }
  throw new Error(`Could not establish connection to AMQP broker (${amqpUrl})`)
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
