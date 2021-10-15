const { setTimeout: sleep } = require('timers/promises')

const request = require('supertest')
const waitOn = require('wait-on')
const AmqpConnector = require('@jvalue/node-dry-amqp/dist/amqpConnector')

const { jsonDateAfter } = require('./testHelper')
const { createMockAdapter, getTriggeredRequests } = require('./mock.adapter')

const AMQP_EXCHANGE = 'ods_global'
const AMQP_IT_QUEUE = 'scheduler_it'
const AMQP_DATASOURCE_CONFIG_TOPIC = 'datasource.config.*'
const AMQP_DATASOURCE_CONFIG_CREATED_TOPIC = 'datasource.config.created'
const AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC = 'datasource.config.updated'
const AMQP_DATASOURCE_CONFIG_DELETED_TOPIC = 'datasource.config.deleted'
const AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC = 'datasource.import-trigger.created'

let amqpConnection
let mockAdapterServer

const {
  SCHEDULER_URL,
  AMQP_URL,
  AMQP_CONNECTION_RETRIES,
  AMQP_CONNECTION_BACKOFF
} = require('./env')

const TIMEOUT = 10000

describe('Scheduler-IT', () => {
  beforeAll(async () => {
    logConfigs()
    try {
      amqpConnection = await AmqpConnector.connect(AMQP_URL, AMQP_CONNECTION_RETRIES, AMQP_CONNECTION_BACKOFF);
      [mockAdapterServer] = await Promise.all([
        createMockAdapter(amqpConnection, AMQP_EXCHANGE, AMQP_IT_QUEUE, AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC),
        waitOn({ resources: [`${SCHEDULER_URL}/`], timeout: 50000, log: false })
      ])
    } catch (err) {
      throw new Error(`Error during setup of tests: ${err}`)
    }
  }, 60000)

  afterAll(async () => {
    await Promise.all([amqpConnection?.close(), mockAdapterServer?.close()])
  }, TIMEOUT)

  test('Should respond with semantic version [GET /version]', async () => {
    const response = await request(SCHEDULER_URL).get('/version')
    expect(response.status).toEqual(200)
    expect(response.type).toEqual('text/plain')
    const semanticVersionRegEx = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/
    expect(response.text).toMatch(semanticVersionRegEx)
  }, TIMEOUT)

  test('Should initialize schedule jobs correctly', async () => {
    await sleep(5000)

    expect(getTriggeredRequests(101)).toBeGreaterThan(1)
  }, TIMEOUT)

  test('Should trigger datasource after creation event', async () => {
    const channel = await createAmqpChannel()

    const creationEvent = createDatasourceEvent(1, 2000, 10000, false)

    channel.publish(AMQP_EXCHANGE, AMQP_DATASOURCE_CONFIG_CREATED_TOPIC, creationEvent)

    await sleep(3000)

    expect(getTriggeredRequests(1)).toBe(1)
  }, TIMEOUT)

  test('Should not trigger datasource after deletion event', async () => {
    const channel = await createAmqpChannel()

    const creationEvent = createDatasourceEvent(2, 2000, 1000, true)
    const deletionEvent = createDeletionEvent(2)

    channel.publish(AMQP_EXCHANGE, AMQP_DATASOURCE_CONFIG_CREATED_TOPIC, creationEvent)
    channel.publish(AMQP_EXCHANGE, AMQP_DATASOURCE_CONFIG_DELETED_TOPIC, deletionEvent)

    await sleep(3000)

    expect(getTriggeredRequests(2)).toBe(0)
  }, TIMEOUT)

  test('Should update trigger after update event', async () => {
    const channel = await createAmqpChannel()

    const creationEvent = createDatasourceEvent(3, 500, 10000, true)
    const updateEvent = createDatasourceEvent(3, 500, 500, true)
    console.log(updateEvent.toString())

    channel.publish(AMQP_EXCHANGE, AMQP_DATASOURCE_CONFIG_CREATED_TOPIC, creationEvent)
    await sleep(200)
    channel.publish(AMQP_EXCHANGE, AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC, updateEvent)

    await sleep(4500)

    expect(getTriggeredRequests(3)).toBeGreaterThan(1)
  }, TIMEOUT)
})

function createDeletionEvent (datasourceId) {
  const event = {
    datasource: {
      id: datasourceId
    }
  }
  return Buffer.from(JSON.stringify(event))
}

function createDatasourceEvent (datasourceId, delay, interval, periodic) {
  const event = {
    datasource: {
      id: datasourceId,
      trigger: {
        firstExecution: jsonDateAfter(delay),
        periodic,
        interval
      }
    }
  }
  return Buffer.from(JSON.stringify(event))
}

const createAmqpChannel = async () => {
  const channel = await amqpConnection.createChannel()
  await channel.assertExchange(AMQP_EXCHANGE, 'topic')
  return channel
}

const logConfigs = () => {
  const msg = `
  AMQP_EXCHANGE: ${AMQP_EXCHANGE}
  AMQP_DATASOURCE_CONFIG_TOPIC: ${AMQP_DATASOURCE_CONFIG_TOPIC}
  AMQP_DATASOURCE_CONFIG_CREATED_TOPIC: ${AMQP_DATASOURCE_CONFIG_CREATED_TOPIC}
  AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC: ${AMQP_DATASOURCE_CONFIG_UPDATED_TOPIC}
  AMQP_DATASOURCE_CONFIG_DELETED_TOPIC: ${AMQP_DATASOURCE_CONFIG_DELETED_TOPIC}
  AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC: ${AMQP_DATASOURCE_IMPORT_TRIGGER_CREATED_TOPIC}

  [Environment Variable] SCHEDULER_URL = ${SCHEDULER_URL}
  [Environment Variable] AMQP_URL = ${AMQP_URL}
  [Environment Variable] AMQP_CONNECTION_RETRIES = ${AMQP_CONNECTION_RETRIES}
  [Environment Variable] AMQP_CONNECTION_BACKOFF = ${AMQP_CONNECTION_BACKOFF}
  `
  console.log(msg)
}
