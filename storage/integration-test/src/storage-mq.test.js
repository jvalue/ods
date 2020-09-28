const waitOn = require('wait-on')
const request = require('supertest')
const AMQP = require('amqplib')
const {
  STORAGEMQ_URL,
  AMQP_URL
} = require('./env')

const AMQP_EXCHANGE = 'ods_global'
const AMQP_PIPELINE_CONFIG_CREATED_TOPIC = 'pipeline.config.created'
const AMQP_PIPELINE_CONFIG_DELETED_TOPIC = 'pipeline.config.deleted'
const AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC = 'pipeline.execution.success'

let amqpConnection

const TIMEOUT = 10000
const PROCESS_TIME = 1000
const SECOND = 1000

describe('IT against Storage-MQ service', () => {
  beforeAll(async () => {
    logConfigs()

    try {
      const promiseResults = await Promise.all([
        amqpConnect(AMQP_URL, 40, 2000),
        waitOn({ resources: [STORAGEMQ_URL + '/'], timeout: 80 * SECOND, log: false })
      ])
      amqpConnection = promiseResults[0]
    } catch (err) {
      throw new Error('Error during setup of tests: ' + err)
    }
  }, 90 * SECOND)

  afterAll(async () => {
    if (amqpConnection) {
      await amqpConnection.close()
    }
  }, TIMEOUT)

  test('Should respond with semantic version [GET /version]', async () => {
    const response = await request(STORAGEMQ_URL).get('/version')

    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')

    const semanticVersionRegEx = '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)'
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx))
  }, TIMEOUT)

  test('Should respond with 404 for non-existing bucket [GET /bucket/3000/content]', async () => {
    const response = await request(STORAGEMQ_URL).get('/bucket/3000/content')
    expect(response.status).toEqual(404)
  }, TIMEOUT)

  test('Should respond with 404 for non-existing bucket content [GET /bucket/3000/content/5]', async () => {
    const response = await request(STORAGEMQ_URL).get('/bucket/3000/content/5')
    expect(response.status).toEqual(404)
  }, TIMEOUT)

  test('Should create bucket without content', async () => {
    const pipelineId = '333'

    const channel = await amqpConnection.createChannel()
    channel.assertExchange(AMQP_EXCHANGE, 'topic', {
      durable: true
    })

    const pipelineCreatedEvent = {
      pipelineId: pipelineId
    }
    const eventAsBuffer = Buffer.from(JSON.stringify(pipelineCreatedEvent))

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, eventAsBuffer)
    await sleep(PROCESS_TIME * 2)

    const response = await request(STORAGEMQ_URL).get(`/bucket/${pipelineId}/content/`)
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('application/json')
    expect(response.body).toEqual([])
  }, TIMEOUT)

  test('Should create bucket with content', async () => {
    const pipelineId = '444'

    const channel = await amqpConnection.createChannel()
    channel.assertExchange(AMQP_EXCHANGE, 'topic', {
      durable: true
    })

    const pipelineCreatedEvent = {
      pipelineId: pipelineId
    }
    const eventAsBuffer = Buffer.from(JSON.stringify(pipelineCreatedEvent))

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, eventAsBuffer)
    await sleep(PROCESS_TIME)

    const pipelineExecutedEvent = {
      pipelineId: pipelineId,
      timestamp: new Date(Date.now()),
      data: { exampleNumber: 123, exampleString: 'abc', exampleArray: [{ x: 'y' }, { t: 456 }] }
    }
    const execEventAsBuffer = Buffer.from(JSON.stringify(pipelineExecutedEvent))

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC, execEventAsBuffer)
    await sleep(PROCESS_TIME)

    const contentResponse = await request(STORAGEMQ_URL).get(`/bucket/${pipelineId}/content/1`)
    expect(contentResponse.status).toEqual(200)
    expect(contentResponse.type).toEqual('application/json')
    expect(contentResponse.body.id).toEqual(1)
    expect(contentResponse.body.timestamp).toEqual(pipelineExecutedEvent.timestamp.toISOString())
    expect(contentResponse.body.pipelineId).toEqual(pipelineExecutedEvent.pipelineId)
    expect(contentResponse.body.data).toEqual(pipelineExecutedEvent.data)

    const allContentResponse = await request(STORAGEMQ_URL).get(`/bucket/${pipelineId}/content`)
    expect(allContentResponse.status).toEqual(200)
    expect(allContentResponse.type).toEqual('application/json')
    expect(allContentResponse.body).toHaveLength(1)
    expect(allContentResponse.body[0]).toEqual(contentResponse.body)
  }, TIMEOUT)

  test('Should respond with 404 for non-existing content of exiting bucket  [GET /bucket/3000/content/5]', async () => {
    const response = await request(STORAGEMQ_URL).get('/bucket/3000/content/5')
    expect(response.status).toEqual(404)
  }, TIMEOUT)

  test('Should respond with 404 after creating a bucket and deleting this bucket immediately', async () => {
    const pipelineId = '555'

    const channel = await amqpConnection.createChannel()
    channel.assertExchange(AMQP_EXCHANGE, 'topic', {
      durable: true
    })

    const pipelineCreatedEvent = {
      pipelineId: pipelineId
    }
    const createdEventAsBuffer = Buffer.from(JSON.stringify(pipelineCreatedEvent))

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_CREATED_TOPIC, createdEventAsBuffer)
    await sleep(PROCESS_TIME)

    const pipelineDeletedEvent = {
      pipelineId: pipelineId
    }
    const deletedEventAsBuffer = Buffer.from(JSON.stringify(pipelineDeletedEvent))

    channel.publish(AMQP_EXCHANGE, AMQP_PIPELINE_CONFIG_DELETED_TOPIC, deletedEventAsBuffer)
    await sleep(PROCESS_TIME)

    const response = await request(STORAGEMQ_URL).get(`/bucket/${pipelineId}/content/`)
    expect(response.status).toEqual(404)
  })
}, TIMEOUT)

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

const logConfigs = () => {
  const msg = `
  AMQP_EXCHANGE: ${AMQP_EXCHANGE}
  AMQP_PIPELINE_CONFIG_CREATED_TOPIC: ${AMQP_PIPELINE_CONFIG_CREATED_TOPIC}
  AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC: ${AMQP_PIPELINE_EXECUTION_SUCCESS_TOPIC}

  [Environment Variable] STORAGEMQ_URL = ${STORAGEMQ_URL}
  [Environment Variable] AMQP_URL = ${AMQP_URL}
  `
  console.log(msg)
}
